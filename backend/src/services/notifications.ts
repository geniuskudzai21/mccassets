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

export type { NotificationParams }