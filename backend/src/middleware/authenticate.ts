import type { NextFunction, Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from './errorHandler.js'

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      throw new HttpError(401, 'Missing or invalid Authorization header')
    }

    const supabase = getSupabase()

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      throw new HttpError(401, 'Invalid or expired token')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      throw new HttpError(500, 'Failed to load user profile')
    }
    if (!profile) {
      throw new HttpError(401, 'User profile not found')
    }

    req.user = {
      id: profile.id,
      role: profile.role,
      department_id: profile.department_id,
    }

    next()
  } catch (err) {
    next(err)
  }
}
