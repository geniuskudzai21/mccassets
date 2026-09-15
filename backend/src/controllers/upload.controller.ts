import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { signUploadSchema } from '../schemas/upload.schema.js'

const bucket = 'photos'

export async function signUpload(req: Request, res: Response) {
  const { filename, size } = signUploadSchema.parse(req.body)

  const supabase = getSupabase()
  const userId = req.user?.id

  if (!userId) {
    throw new HttpError(401, 'Authentication required')
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${crypto.randomUUID()}-${safeFilename}`

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, {
    upsert: false,
  })

  if (error) {
    throw new HttpError(500, 'Failed to create upload URL')
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)

  res.status(201).json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: publicData.publicUrl,
    fileSize: size,
  })
}
