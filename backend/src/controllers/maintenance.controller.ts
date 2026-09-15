import type { Request, Response } from 'express'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { maintenanceQuerySchema, maintenanceUpdateSchema } from '../schemas/maintenance.schema.js'
import type { MaintenanceRequest } from '../types/db.js'

interface MaintenanceWithLinks {
  id: string
  asset_id: string
  raised_by: string | null
  assigned_to: string | null
  status: string
  description: string
  estimated_cost: number | null
  created_at: string
  resolved_at: string | null
  asset?: { id: string; asset_tag: string; type: string; current_status: string } | null
  assignee?: { id: string; full_name: string; role: string } | null
  [key: string]: unknown
}

async function attachLinks(rows: MaintenanceWithLinks[]): Promise<MaintenanceWithLinks[]> {
  if (rows.length === 0) return rows
  const supabase = getSupabase()

  const assetIds = [...new Set(rows.map((row) => row.asset_id))]
  const assigneeIds = [...new Set(rows.map((row) => row.assigned_to).filter(Boolean) as string[])]

  const [assetResult, assigneeResult] = await Promise.all([
    supabase.from('assets').select('id, asset_tag, type, current_status').in('id', assetIds),
    assigneeIds.length > 0
      ? supabase.from('profiles').select('id, full_name, role').in('id', assigneeIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (assetResult.error) {
    throw new HttpError(500, 'Failed to load asset details')
  }
  if (assigneeResult.error) {
    throw new HttpError(500, 'Failed to load assignee details')
  }

  const assetsById = new Map((assetResult.data ?? []).map((row) => [row.id, row]))
  const profilesById = new Map((assigneeResult.data ?? []).map((row) => [row.id, row]))

  return rows.map((row) => ({
    ...row,
    asset: assetsById.get(row.asset_id) ?? null,
    assignee: row.assigned_to ? (profilesById.get(row.assigned_to) ?? null) : null,
  }))
}

export async function listMaintenanceRequests(req: Request, res: Response) {
  const query = maintenanceQuerySchema.parse(req.query)
  const supabase = getSupabase()

  let builder = supabase.from('maintenance_requests').select('*', { count: 'exact' })

  if (query.status) {
    builder = builder.eq('status', query.status)
  }
  if (query.assigned_to) {
    builder = builder.eq('assigned_to', query.assigned_to)
  }
  if (query.asset_id) {
    builder = builder.eq('asset_id', query.asset_id)
  }

  const { data, error, count } = await builder
    .order('created_at', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1)

  if (error) {
    throw new HttpError(500, 'Failed to list maintenance requests')
  }

  const rows = await attachLinks((data ?? []) as MaintenanceWithLinks[])

  res.json({
    data: rows,
    total: count ?? rows.length,
    limit: query.limit,
    offset: query.offset,
  })
}

export async function updateMaintenanceRequest(req: Request, res: Response) {
  const value = req.params.id
  if (typeof value !== 'string') {
    throw new HttpError(404, 'Maintenance request not found')
  }
  const id = value
  const body = maintenanceUpdateSchema.parse(req.body)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new HttpError(404, 'Maintenance request not found')
  }

  const nextStatus = body.status ?? existing.status
  const patch: MaintenanceRequest['Update'] = {}
  if (body.status) {
    patch.status = body.status
    patch.resolved_at = body.status === 'completed' ? new Date().toISOString() : null
  }
  if (body.assigned_to !== undefined) {
    patch.assigned_to = body.assigned_to
  }
  if (body.description !== undefined) {
    patch.description = body.description
  }
  if (body.estimated_cost !== undefined) {
    patch.estimated_cost = body.estimated_cost
  }

  const { data: updated, error } = await supabase
    .from('maintenance_requests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to update maintenance request')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'maintenance.update',
    entity_type: 'maintenance_requests',
    entity_id: id,
    metadata: { from: existing.status, to: nextStatus, assigned_to: body.assigned_to ?? undefined },
  })

  const rows = await attachLinks([updated as MaintenanceWithLinks])

  res.json({ data: rows[0] })
}
