import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function getMe(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    throw new HttpError(401, 'Authentication required')
  }

  const supabase = getSupabase()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new HttpError(500, 'Failed to load profile')
  }
  if (!profile) {
    throw new HttpError(404, 'Profile not found')
  }

  res.json(profile)
}
