import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { computeScheduleData } from '../services/scheduling.js'
import type { Asset } from '../types/db.js'

export async function getDueSchedules(_req: Request, res: Response) {
  const supabase = getSupabase()
  const asOf = new Date()

  const [{ data: assets, error: assetsError }, { data: inspections, error: inspectionsError }] =
    await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('inspections').select('asset_id, inspected_at'),
    ])

  if (assetsError || inspectionsError) {
    throw new HttpError(500, 'Failed to load asset schedules')
  }

  const lastInspection = new Map<string, string>()
  for (const row of inspections ?? []) {
    const current = lastInspection.get(row.asset_id)
    if (!current || row.inspected_at > current) {
      lastInspection.set(row.asset_id, row.inspected_at)
    }
  }

  const schedule = computeScheduleData((assets ?? []) as Asset['Row'][], lastInspection, asOf)

  res.json({ data: schedule })
}