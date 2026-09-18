import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function listCentres(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data, error } = await supabase.from('centres').select('*').order('name')

  if (error) {
    throw new HttpError(500, 'Failed to load centres')
  }

  res.json({ data })
}