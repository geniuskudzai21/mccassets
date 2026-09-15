import type { Request, Response } from 'express'
import { getSupabase } from '../../config/supabase.js'
import { HttpError } from '../../middleware/errorHandler.js'
import { createDisposalSchema, updateDisposalSchema } from '../../schemas/admin.schema.js'
import type { Disposal } from '../../types/db.js'

function paramId(req: Request): string {
  const value = req.params.id
  if (typeof value !== 'string') {
    throw new HttpError(404, 'Disposal record not found')
  }
  return value
}

export async function listDisposals(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data: disposals, error } = await supabase
    .from('disposals')
    .select('*')
    .order('disposal_date', { ascending: false })

  if (error) {
    throw new HttpError(500, 'Failed to load disposals')
  }

  const rows = disposals ?? []
  const assetIds = [...new Set(rows.map((row) => row.asset_id))]
  const userIds = [
    ...new Set(
      rows.flatMap((row) => [row.disposed_by, row.approved_by].filter(Boolean) as string[]),
    ),
  ]

  const [assetResult, profileResult] = await Promise.all([
    supabase.from('assets').select('id, asset_tag, brand, model, current_status'),
    supabase.from('profiles').select('id, full_name'),
  ])

  if (assetResult.error || profileResult.error) {
    throw new HttpError(500, 'Failed to load disposal details')
  }

  const assetsById = new Map((assetResult.data ?? []).map((a) => [a.id, a]))
  const profilesById = new Map((profileResult.data ?? []).map((p) => [p.id, p]))
  void assetIds
  void userIds

  res.json({
    data: rows.map((row) => ({
      ...row,
      asset: assetsById.get(row.asset_id) ?? null,
      disposed_by: row.disposed_by ? (profilesById.get(row.disposed_by) ?? null) : null,
      approved_by: row.approved_by ? (profilesById.get(row.approved_by) ?? null) : null,
    })),
  })
}

export async function createDisposal(req: Request, res: Response) {
  const body = createDisposalSchema.parse(req.body)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, asset_tag')
    .eq('id', body.asset_id)
    .maybeSingle()

  if (assetError) {
    throw new HttpError(500, 'Failed to load asset')
  }
  if (!asset) {
    throw new HttpError(404, 'Asset not found')
  }

  const { data: disposal, error } = await supabase
    .from('disposals')
    .insert({
      asset_id: body.asset_id,
      disposed_by: actorId,
      reason: body.reason,
      disposal_date: body.disposal_date ?? new Date().toISOString().slice(0, 10),
      approved_by: null,
    })
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to record disposal')
  }

  const { error: statusError } = await supabase
    .from('assets')
    .update({ current_status: 'disposal' })
    .eq('id', body.asset_id)

  if (statusError) {
    throw new HttpError(500, 'Disposal recorded but asset status update failed')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'disposal.create',
    entity_type: 'disposals',
    entity_id: disposal.id,
    metadata: { asset_id: body.asset_id, asset_tag: asset.asset_tag },
  })

  res.status(201).json({ data: disposal })
}

export async function updateDisposal(req: Request, res: Response) {
  const id = paramId(req)
  const body = updateDisposalSchema.parse(req.body)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const { data: existing, error: fetchError } = await supabase
    .from('disposals')
    .select('id, approved_by')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new HttpError(404, 'Disposal record not found')
  }

  const patch: Disposal['Update'] = {}
  if (body.reason !== undefined) patch.reason = body.reason
  if (body.disposal_date !== undefined) patch.disposal_date = body.disposal_date
  if (body.action === 'approve') patch.approved_by = actorId
  if (body.action === 'revoke') patch.approved_by = null

  const { data: updated, error } = await supabase
    .from('disposals')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to update disposal record')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'disposal.update',
    entity_type: 'disposals',
    entity_id: id,
    metadata: { action: body.action ?? 'edit', reason: body.reason ?? undefined },
  })

  res.json({ data: updated })
}
