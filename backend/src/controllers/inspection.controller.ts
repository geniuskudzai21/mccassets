import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { createInspectionSchema, inspectionQuerySchema } from '../schemas/inspection.schema.js'
import { applyInspectionResult } from '../services/assetStatus.js'
import type { Inspection } from '../types/db.js'

type InspectionRow = Inspection['Row']

export async function listInspections(req: Request, res: Response) {
  const query = inspectionQuerySchema.parse(req.query)

  const supabase = getSupabase()
  let builder = supabase.from('inspections').select('*', { count: 'exact' })

  if (query.asset_id) {
    builder = builder.eq('asset_id', query.asset_id)
  }
  if (query.technician_id) {
    builder = builder.eq('technician_id', query.technician_id)
  }

  builder = builder
    .range(query.offset, query.offset + query.limit - 1)
    .order('inspected_at', { ascending: false })

  const { data, error, count } = await builder

  if (error) {
    throw new HttpError(500, 'Failed to load inspections')
  }

  res.json({
    data: data as InspectionRow[],
    total: count ?? 0,
    limit: query.limit,
    offset: query.offset,
  })
}

export async function createInspection(req: Request, res: Response) {
  const body = createInspectionSchema.parse(req.body)
  const technicianId = req.user?.id

  if (!technicianId) {
    throw new HttpError(401, 'Authentication required')
  }

  const supabase = getSupabase()

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id')
    .eq('id', body.asset_id)
    .maybeSingle()

  if (assetError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!asset) {
    throw new HttpError(404, 'Asset not found')
  }

  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      asset_id: body.asset_id,
      technician_id: technicianId,
      status: body.status,
      notes: body.notes ?? null,
      photo_urls: body.photo_urls ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      client_uuid: body.client_uuid ?? null,
      sync_status: 'synced',
    })
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to save inspection')
  }

  await applyInspectionResult({
    assetId: body.asset_id,
    inspectionId: inspection.id,
    status: body.status,
    technicianId,
  })

  res.status(201).json({ data: inspection as InspectionRow })
}
