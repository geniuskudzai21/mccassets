import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/db.js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.')
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD.')
  process.exit(1)
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle()

if (profileError) {
  console.error('Failed to look up profile:', profileError.message)
  process.exit(1)
}
if (!profile) {
  console.error(`No profile found for ${email}.`)
  process.exit(1)
}

const { error } = await supabase.auth.admin.updateUserById(profile.id, { password })

if (error) {
  console.error('Failed to update password:', error.message)
  process.exit(1)
}

console.log(`Password updated for ${email}.`)