import { apiPost } from './api.ts'

export interface SignUploadResponse {
  signedUrl: string
  publicUrl: string
  path: string
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function uploadPhotoBlob(blob: Blob, contentType: string): Promise<string> {
  const ext = ALLOWED_TYPES[contentType] ?? 'jpg'
  const filename = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const sign = await apiPost<SignUploadResponse>('/api/uploads/sign', {
    filename,
    contentType,
    size: blob.size,
  })

  const response = await fetch(sign.signedUrl, {
    method: 'PUT',
    headers: { 'content-type': contentType, 'x-upsert': 'false' },
    body: blob,
  })

  if (!response.ok) {
    throw new Error(`Photo upload failed with status ${response.status}`)
  }

  return sign.publicUrl
}
