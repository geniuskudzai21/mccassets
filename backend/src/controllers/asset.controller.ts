import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { assetQuerySchema, createAssetSchema, updateAssetSchema } from '../schemas/asset.schema.js'
import type { Asset } from '../types/db.js'

type AssetRow = Asset['Row']

function paramId(req: Request): string {
  const value = req.params.id
  if (typeof value !== 'string') {
    throw new HttpError(404, 'Asset not found')
  }
  return value
}

export async function listAssets(req: Request, res: Response) {
  const query = assetQuerySchema.parse(req.query)

  const supabase = getSupabase()
  let builder = supabase.from('assets').select('*', { count: 'exact' })

  if (query.status) {
    builder = builder.eq('current_status', query.status)
  }
  if (query.department_id) {
    builder = builder.eq('department_id', query.department_id)
  }
  if (query.type) {
    builder = builder.eq('type', query.type)
  }
  if (query.q) {
    builder = builder.or(
      `asset_tag.ilike.%${query.q}%,brand.ilike.%${query.q}%,model.ilike.%${query.q}%,serial_number.ilike.%${query.q}%`,
    )
  }

  builder = builder.range(query.offset, query.offset + query.limit - 1).order('created_at', {
    ascending: false,
  })

  const { data, error, count } = await builder

  if (error) {
    throw new HttpError(500, 'Failed to load assets')
  }

  res.json({
    data: data as AssetRow[],
    total: count ?? 0,
    limit: query.limit,
    offset: query.offset,
  })
}

export async function getAssetStats(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('assets')
    .select('id, asset_tag, type, current_status, brand, model, building, room, last_lat, last_lng')

  if (error) {
    throw new HttpError(500, 'Failed to load asset stats')
  }

  const rows = data ?? []
  const byStatus: Record<string, number> = {
    good: 0,
    fair: 0,
    poor: 0,
    disposal: 0,
  }

  for (const row of rows) {
    byStatus[row.current_status] = (byStatus[row.current_status] ?? 0) + 1
  }

  res.json({
    data: {
      total: rows.length,
      by_status: byStatus,
      located: rows.filter((row) => row.last_lat != null && row.last_lng != null),
    },
  })
}

export async function getAssetById(req: Request, res: Response) {
  const supabase = getSupabase()
  const assetId = paramId(req)

  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .maybeSingle()

  if (error) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!asset) {
    throw new HttpError(404, 'Asset not found')
  }

  res.json({ data: asset as AssetRow })
}

export async function createAsset(req: Request, res: Response) {
  const body = createAssetSchema.parse(req.body)

  const supabase = getSupabase()

  const { data: asset, error } = await supabase.from('assets').insert(body).select('*').single()

  if (error) {
    throw new HttpError(500, 'Failed to create asset')
  }

  await supabase.from('audit_log').insert({
    user_id: req.user?.id ?? null,
    action: 'asset.create',
    entity_type: 'assets',
    entity_id: asset.id,
    metadata: { asset_tag: asset.asset_tag },
  })

  res.status(201).json({ data: asset as AssetRow })
}

export async function updateAsset(req: Request, res: Response) {
  const body = updateAssetSchema.parse(req.body)
  const assetId = paramId(req)

  const supabase = getSupabase()

  const { data: existing, error: existingError } = await supabase
    .from('assets')
    .select('id')
    .eq('id', assetId)
    .maybeSingle()

  if (existingError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!existing) {
    throw new HttpError(404, 'Asset not found')
  }

  const { data: asset, error } = await supabase
    .from('assets')
    .update(body)
    .eq('id', assetId)
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to update asset')
  }

  await supabase.from('audit_log').insert({
    user_id: req.user?.id ?? null,
    action: 'asset.update',
    entity_type: 'assets',
    entity_id: asset.id,
    metadata: { asset_tag: asset.asset_tag },
  })

  res.json({ data: asset as AssetRow })
}

export async function deleteAsset(req: Request, res: Response) {
  const supabase = getSupabase()
  const assetId = paramId(req)

  const { data: existing, error: existingError } = await supabase
    .from('assets')
    .select('id, asset_tag')
    .eq('id', assetId)
    .maybeSingle()

  if (existingError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!existing) {
    throw new HttpError(404, 'Asset not found')
  }

  const { error } = await supabase.from('assets').delete().eq('id', assetId)

  if (error) {
    throw new HttpError(500, 'Failed to delete asset')
  }

  await supabase.from('audit_log').insert({
    user_id: req.user?.id ?? null,
    action: 'asset.delete',
    entity_type: 'assets',
    entity_id: assetId,
    metadata: { asset_tag: existing.asset_tag },
  })

  res.status(204).send()
}

export async function getAssetHistory(req: Request, res: Response) {
  const supabase = getSupabase()
  const assetId = paramId(req)

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id')
    .eq('id', assetId)
    .maybeSingle()

  if (assetError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!asset) {
    throw new HttpError(404, 'Asset not found')
  }

  const [inspections, maintenance] = await Promise.all([
    supabase
      .from('inspections')
      .select('*')
      .eq('asset_id', assetId)
      .order('inspected_at', { ascending: false }),
    supabase
      .from('maintenance_requests')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false }),
  ])

  if (inspections.error) {
    throw new HttpError(500, 'Failed to load inspections')
  }
  if (maintenance.error) {
    throw new HttpError(500, 'Failed to load maintenance requests')
  }

  const timeline = [
    ...(inspections.data ?? []).map((item) => ({
      kind: 'inspection' as const,
      at: item.inspected_at,
      item,
    })),
    ...(maintenance.data ?? []).map((item) => ({
      kind: 'maintenance' as const,
      at: item.created_at,
      item,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  res.json({ data: timeline })
}
