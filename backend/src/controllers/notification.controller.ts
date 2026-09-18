import type { Request, Response } from 'express'
import { z } from 'zod'
import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import type { Notification } from '../types/db.js'

type NotificationRow = Notification['Row']

export async function listNotifications(req: Request, res: Response) {
  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'Authentication required')
  }

  const query = z
    .object({
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .parse(req.query)

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(query.limit)

  if (error) {
    throw new HttpError(500, 'Failed to load notifications')
  }

  const rows = (data ?? []) as NotificationRow[]

  const assetIds = [...new Set(rows.map((row) => row.asset_id).filter(Boolean) as string[])]
  let assetsById = new Map<string, { id: string; asset_tag: string }>()

  if (assetIds.length > 0) {
    const { data: assets, error: assetError } = await supabase
      .from('assets')
      .select('id, asset_tag')
      .in('id', assetIds)
    if (!assetError) {
      assetsById = new Map((assets ?? []).map((asset) => [asset.id, asset]))
    }
  }

  const unread = rows.filter((row) => row.read_at === null).length

  res.json({
    data: rows.map((row) => ({
      ...row,
      asset: row.asset_id ? (assetsById.get(row.asset_id) ?? null) : null,
    })),
    unread,
  })
}

export async function markNotificationRead(req: Request, res: Response) {
  const userId = req.user?.id
  const value = req.params.id
  if (!userId) {
    throw new HttpError(401, 'Authentication required')
  }
  if (typeof value !== 'string') {
    throw new HttpError(404, 'Notification not found')
  }

  const supabase = getSupabase()

  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('id')
    .eq('id', value)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new HttpError(404, 'Notification not found')
  }

  const { data: updated, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', value)
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to update notification')
  }

  res.json({ data: updated as NotificationRow })
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'Authentication required')
  }

  const supabase = getSupabase()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) {
    throw new HttpError(500, 'Failed to update notifications')
  }

  res.json({ data: { updated: true } })
}