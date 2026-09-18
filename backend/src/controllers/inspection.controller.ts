import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import {
  createInspectionSchema,
  createNewAssetInspectionSchema,
  inspectionQuerySchema,
  syncInspectionsSchema,
} from '../schemas/inspection.schema.js'
import { applyInspectionResult } from '../services/assetStatus.js'
import type { AssetStatus, Inspection } from '../types/db.js'

const MAX_SYNC_BATCH = 50

type InspectionRow = Inspection['Row']

interface InspectionRecordParams {
  assetId: string
  technicianId: string
  status: AssetStatus
  notes?: string | null
  photoUrls?: string[] | null
  lat?: number | null
  lng?: number | null
  clientUuid?: string | null
}

async function createInspectionRecord(
  supabase: ReturnType<typeof getSupabase>,
  params: InspectionRecordParams,
): Promise<InspectionRow> {
  const { data, error } = await supabase
    .from('inspections')
    .insert({
      asset_id: params.assetId,
      technician_id: params.technicianId,
      status: params.status,
      notes: params.notes ?? null,
      photo_urls: params.photoUrls ?? null,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
      client_uuid: params.clientUuid ?? null,
      sync_status: 'synced',
    })
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to save inspection')
  }

  await applyInspectionResult({
    assetId: params.assetId,
    inspectionId: data.id,
    status: params.status,
    technicianId: params.technicianId,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
  })

  return data as InspectionRow
}

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
    lat: inspection.lat ?? null,
    lng: inspection.lng ?? null,
  })

  res.status(201).json({ data: inspection as InspectionRow })
}

/**
 * Register a brand-new asset from the field and immediately record an
 * inspection against it. Intended for items that turn up without a tag in the
 * register. If the tag already exists, the inspection is attached to it.
 */
export async function createNewAssetInspection(req: Request, res: Response) {
  const body = createNewAssetInspectionSchema.parse(req.body)
  const technicianId = req.user?.id

  if (!technicianId) {
    throw new HttpError(401, 'Authentication required')
  }

  const supabase = getSupabase()
  const assetTag = body.asset_tag.trim()

  let assetId: string

  const { data: existing, error: existingError } = await supabase
    .from('assets')
    .select('id')
    .ilike('asset_tag', assetTag)
    .maybeSingle()

  if (existingError) {
    throw new HttpError(500, 'Failed to look up asset')
  }

  if (existing) {
    assetId = existing.id
  } else {
    const { data: created, error } = await supabase
      .from('assets')
      .insert({
        asset_tag: assetTag,
        type: body.type,
        purchase_date: new Date().toISOString(),
        purchase_cost: body.purchase_cost ?? null,
        useful_life_years: body.useful_life_years ?? undefined,
        brand: body.brand ?? null,
        model: body.model ?? null,
        serial_number: body.serial_number ?? null,
        department_id: body.department_id ?? null,
        assigned_user: body.assigned_user ?? null,
        building: body.building ?? null,
        room: body.room ?? null,
        warranty_expiry: body.warranty_expiry ?? null,
        last_lat: body.lat ?? null,
        last_lng: body.lng ?? null,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        const { data: raced } = await supabase
          .from('assets')
          .select('id')
          .eq('asset_tag', assetTag)
          .maybeSingle()
        if (!raced) throw new HttpError(500, 'Failed to register new asset')
        assetId = raced.id
      } else {
        throw new HttpError(500, 'Failed to register new asset')
      }
    } else {
      assetId = created.id
    }
  }

  const inspection = await createInspectionRecord(supabase, {
    assetId,
    technicianId,
    status: body.status,
    notes: body.notes ?? null,
    photoUrls: body.photo_urls ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    clientUuid: body.client_uuid ?? null,
  })

  res.status(201).json({ data: inspection })
}

/**
 * Batch upsert for offline queue flush. Idempotent on client_uuid: items that
 * already exist for that key are skipped rather than applied twice. Batch is
 * capped server-side, regardless of what the client sends.
 */
export async function syncInspections(req: Request, res: Response) {
  const technicianId = req.user?.id
  if (!technicianId) {
    throw new HttpError(401, 'Authentication required')
  }

  const { inspections: items } = syncInspectionsSchema.parse(req.body)
  const batch = items.slice(0, MAX_SYNC_BATCH)

  const supabase = getSupabase()
  const syncedUuids: string[] = []
  const inspections: InspectionRow[] = []

  for (const item of batch) {
    const { data: existing } = await supabase
      .from('inspections')
      .select('id')
      .eq('client_uuid', item.client_uuid)
      .maybeSingle()

    if (existing) {
      syncedUuids.push(item.client_uuid)
      continue
    }

    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        asset_id: item.asset_id,
        technician_id: technicianId,
        status: item.status,
        notes: item.notes ?? null,
        photo_urls: item.photo_urls ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        client_uuid: item.client_uuid,
        sync_status: 'synced',
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        syncedUuids.push(item.client_uuid)
        continue
      }
      throw new HttpError(500, 'Failed to sync inspections')
    }

    await applyInspectionResult({
      assetId: item.asset_id,
      inspectionId: inspection.id,
      status: item.status,
      technicianId,
      lat: inspection.lat ?? null,
      lng: inspection.lng ?? null,
    })

    syncedUuids.push(item.client_uuid)
    inspections.push(inspection as InspectionRow)
  }

  res.json({
    data: {
      processed: syncedUuids.length,
      client_uuids: syncedUuids,
      inspections,
    },
  })
}
