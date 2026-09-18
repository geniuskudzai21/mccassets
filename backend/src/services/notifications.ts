import { getSupabase } from '../config/supabase.js'

interface NotificationParams {
  userId: string
  type: string
  title: string
  body?: string
  assetId?: string | null
}

/** Inserts an in-app notification row for a single user. Logs a write error without throwing. */
export async function notify(userId: string, type: string, title: string, body: string = '', assetId?: string | null): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    asset_id: assetId ?? null,
  })
  if (error) {
    // Notifications must never break the action that triggered them.
    // eslint-disable-next-line no-console
    console.error('Failed to write notification', error.message)
  }
}

interface MarkNotificationsReadInput {
  userId: string
  type?: string
  assetId?: string | null
}

/** Marks a user's unread notifications as read, optionally scoped by type and/or asset. */
export async function markNotificationsRead(input: MarkNotificationsReadInput): Promise<void> {
  const supabase = getSupabase()
  let builder = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', input.userId)
    .is('read_at', null)

  if (input.type) {
    builder = builder.eq('type', input.type)
  }
  if (input.assetId) {
    builder = builder.eq('asset_id', input.assetId)
  }

  const { error } = await builder
  if (error) {
    // Best-effort: clearing notifications must never break the triggering action.
    // eslint-disable-next-line no-console
    console.error('Failed to mark notifications read', error.message)
  }
}

/** Returns true if the user already has an unread notification matching type + asset. */
export async function hasUnreadNotification(input: {
  userId: string
  type: string
  assetId?: string | null
}): Promise<boolean> {
  const supabase = getSupabase()
  let builder = supabase.from('notifications').select('id')

  if (input.assetId) {
    builder = builder.eq('asset_id', input.assetId)
  }

  const { data } = await builder.eq('user_id', input.userId).eq('type', input.type).is('read_at', null)
  return (data ?? []).length > 0
}

export type { NotificationParams }