import { supabase } from './supabase.ts'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const SESSION_GRACE_MS = 30 * 1000

export interface ApiErrorShape {
  code: string
  message: string
  details?: unknown
}

export class ApiError extends Error {
  code: string
  details?: unknown
  status: number

  constructor(status: number, { code, message, details }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let refreshPromise: Promise<string | null> | null = null

function refreshSessionOnce(): Promise<string | null> {
  // Supabase rotates the refresh token on every refresh, so concurrent
  // calls (parallel page requests) would burn each other's tokens and
  // kill the whole session. Serialise refreshes through a single promise.
  if (!refreshPromise) {
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data }) => data.session?.access_token ?? null)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function currentAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const expiresAt = session.expires_at
  if (expiresAt == null || expiresAt * 1000 - Date.now() >= SESSION_GRACE_MS) {
    return session.access_token
  }

  return refreshSessionOnce()
}

async function recoverSession(): Promise<string | null> {
  return refreshSessionOnce()
}

async function endSessionForReauth() {
  // `scope: 'local'` clears the stored session without a server round trip,
  // so a dead refresh token (403 on global sign out) can never trap the user.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorShape> {
  let body: { error?: ApiErrorShape } | undefined
  try {
    body = (await response.json()) as { error?: ApiErrorShape }
  } catch {
    body = undefined
  }
  return body?.error ?? { code: 'UNKNOWN', message: `Request failed (${response.status})` }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  const accessToken = await currentAccessToken()
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const request = (token: string | null) => {
    const finalHeaders = new Headers(headers)
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`)
    }
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: finalHeaders,
      signal: AbortSignal.timeout(20000),
    })
  }

  let response = await request(accessToken)

  if (response.status === 401 && accessToken) {
    const freshToken = await recoverSession()
    if (freshToken) {
      response = await request(freshToken)
    }
  }

  if (response.status === 401) {
    await endSessionForReauth()
    throw new ApiError(response.status, await parseErrorBody(response))
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiGet = <T>(path: string) => api<T>(path)

export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' })