import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function listDepartments(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data, error } = await supabase.from('departments').select('*').order('name')

  if (error) {
    throw new HttpError(500, 'Failed to load departments')
  }

  res.json({ data })
}

export async function createDepartment(req: Request, res: Response) {
  const supabase = getSupabase()

  const { data, error } = await supabase.from('departments').insert(req.body).select('*').single()

  if (error) {
    throw new HttpError(500, 'Failed to create department')
  }

  res.status(201).json({ data })
}
