import { z } from 'zod'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxFileSize = 5 * 1024 * 1024 // 5 MB

export const signUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().refine((value) => allowedMimeTypes.includes(value), {
    message: 'Unsupported image type — use JPEG, PNG, or WebP',
  }),
  size: z.number().int().positive().max(maxFileSize, 'Image must be under 5 MB'),
})

export type SignUploadInput = z.infer<typeof signUploadSchema>
