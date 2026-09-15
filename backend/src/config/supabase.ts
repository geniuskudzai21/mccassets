import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db.js'
import { config } from './index.js'

let client: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!client) {
    client = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return client
}
