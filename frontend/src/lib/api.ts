import { supabase } from './supabase.ts'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    let body: { error?: ApiErrorShape } | undefined
    try {
      body = (await response.json()) as { error?: ApiErrorShape }
    } catch {
      body = undefined
    }
    throw new ApiError(
      response.status,
      body?.error ?? { code: 'UNKNOWN', message: `Request failed (${response.status})` },
    )
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
