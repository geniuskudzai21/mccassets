import type { Request, Response } from 'express'
import { z } from 'zod'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import type { UserRole } from '../types/db.js'

const userQuerySchema = z.object({
  role: z.string().optional(),
})

export async function listUsers(req: Request, res: Response) {
  const query = userQuerySchema.parse(req.query)
  const supabase = getSupabase()

  let builder = supabase.from('profiles').select('id, full_name, role, department_id')

  if (query.role) {
    builder = builder.eq('role', query.role as UserRole)
  }

  const { data, error } = await builder.order('full_name', { ascending: true })

  if (error) {
    throw new HttpError(500, 'Failed to load users')
  }

  res.json({ data })
}
