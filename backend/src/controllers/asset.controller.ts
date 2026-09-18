import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import {
  assetQuerySchema,
  createAssetSchema,
  createTransferSchema,
  updateAssetSchema,
} from '../schemas/asset.schema.js'
import { assessFunctional } from '../services/assetFunctional.js'
import { depreciateAsset } from '../services/depreciation.js'
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
      `asset_tag.ilike.%${query.q}%,brand.ilike.%${query.q}%,model.ilike.%${query.q}%,serial_number.ilike.%${query.q}%,building.ilike.%${query.q}%,room.ilike.%${query.q}%`,
    )
  }
  if (query.location) {
    builder = builder.or(
      `building.ilike.%${query.location}%,room.ilike.%${query.location}%`,
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

  const row = asset as AssetRow

  let departmentName: string | null = null
  if (row.department_id) {
    const { data: department } = await supabase
      .from('departments')
      .select('name')
      .eq('id', row.department_id)
      .maybeSingle()
    departmentName = department?.name ?? null
  }

  let assignedUserName: string | null = null
  if (row.assigned_user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', row.assigned_user)
      .maybeSingle()
    assignedUserName = profile?.full_name ?? null
  }

  const depreciation = depreciateAsset(row)
  const ageYears = Math.max(
    0,
    (new Date().getTime() - new Date(row.purchase_date).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  )

  const { count: openFaults } = await supabase
    .from('maintenance_requests')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', assetId)
    .in('status', ['pending', 'approved', 'in_progress'])

  const functional = assessFunctional({
    currentStatus: row.current_status,
    openFaults: openFaults ?? 0,
    replacementDue: depreciation.replacementDue,
  })

  res.json({
    data: {
      ...row,
      department_name: departmentName,
      assigned_user_name: assignedUserName,
      age_years: Math.round(ageYears * 100) / 100,
      current_value: Math.round(depreciation.currentValue * 100) / 100,
      annual_depreciation:
        depreciation.usefulLifeYears > 0
          ? Math.round((depreciation.cost / depreciation.usefulLifeYears) * 100) / 100
          : 0,
      end_of_life: depreciation.endOfLife,
      days_to_end: depreciation.daysToEnd,
      replacement_due: depreciation.replacementDue,
      functional: functional.functional,
      functional_flags: functional.flags,
    },
  })
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

/**
 * Records a department-to-department transfer, updates the asset and writes an
 * audit-log entry. Kept as a dedicated endpoint so transfers have a permanent
 * trail instead of being an ambiguous asset edit.
 */
export async function transferAsset(req: Request, res: Response) {
  const assetId = paramId(req)
  const body = createTransferSchema.parse(req.body)
  const actorId = req.user?.id

  const supabase = getSupabase()

  const { data: existing, error: existingError } = await supabase
    .from('assets')
    .select('id, asset_tag, department_id')
    .eq('id', assetId)
    .maybeSingle()

  if (existingError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!existing) {
    throw new HttpError(404, 'Asset not found')
  }

  const { data: department, error: departmentError } = await supabase
    .from('departments')
    .select('id')
    .eq('id', body.to_department_id)
    .maybeSingle()

  if (departmentError) {
    throw new HttpError(500, 'Failed to load destination department')
  }
  if (!department) {
    throw new HttpError(404, 'Destination department not found')
  }

  const { data: transfer, error } = await supabase
    .from('transfers')
    .insert({
      asset_id: assetId,
      from_department_id: existing.department_id,
      to_department_id: body.to_department_id,
      transferred_by: actorId ?? null,
      notes: body.notes ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to record transfer')
  }

  const { error: updateError } = await supabase
    .from('assets')
    .update({ department_id: body.to_department_id })
    .eq('id', assetId)

  if (updateError) {
    throw new HttpError(500, 'Transfer recorded but asset department update failed')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId ?? null,
    action: 'transfer.create',
    entity_type: 'assets',
    entity_id: assetId,
    metadata: {
      asset_tag: existing.asset_tag,
      from_department_id: existing.department_id,
      to_department_id: body.to_department_id,
    },
  })

  res.status(201).json({ data: transfer })
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

  const [inspections, maintenance, transfers] = await Promise.all([
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
    supabase
      .from('transfers')
      .select('*')
      .eq('asset_id', assetId)
      .order('transferred_at', { ascending: false }),
  ])

  if (inspections.error) {
    throw new HttpError(500, 'Failed to load inspections')
  }
  if (maintenance.error) {
    throw new HttpError(500, 'Failed to load maintenance requests')
  }
  if (transfers.error) {
    throw new HttpError(500, 'Failed to load transfers')
  }

  const departmentIds = [
    ...new Set(
      (transfers.data ?? []).flatMap(
        (row) => [row.from_department_id, row.to_department_id].filter(Boolean) as string[],
      ),
    ),
  ]
  const { data: departmentsRaw } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', departmentIds.length > 0 ? departmentIds : ['00000000-0000-0000-0000-000000000000'])

  const departmentsById = new Map((departmentsRaw ?? []).map((row) => [row.id, row.name]))

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
    ...(transfers.data ?? []).map((item) => ({
      kind: 'transfer' as const,
      at: item.transferred_at,
      item: {
        ...item,
        from_department_name: item.from_department_id
          ? (departmentsById.get(item.from_department_id) ?? null)
          : null,
        to_department_name: item.to_department_id
          ? (departmentsById.get(item.to_department_id) ?? null)
          : null,
      },
    })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  res.json({ data: timeline })
}
