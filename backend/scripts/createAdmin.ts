import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/db.js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.')
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL
const fullName = process.env.ADMIN_NAME ?? 'System Administrator'
const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString('base64url')

if (!email) {
  console.error('Set ADMIN_EMAIL (e.g. ADMIN_EMAIL=admin@example.com).')
  process.exit(1)
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const existing = await supabase.from('profiles').select('id, role').eq('email', email).maybeSingle()
if (existing.data) {
  console.error(`A profile already exists for ${email} (role: ${existing.data.role}). No changes made.`)
  process.exit(1)
}
if (existing.error) {
  console.error('Failed to check for existing user:', existing.error.message)
  process.exit(1)
}

const { data: created, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
})

if (authError || !created?.user) {
  console.error('Failed to create auth user:', authError?.message ?? 'no user returned')
  process.exit(1)
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role: 'admin',
    department_id: null,
    phone: null,
    is_active: true,
  })
  .select('*')
  .single()

if (profileError) {
  await supabase.auth.admin.deleteUser(created.user.id)
  console.error('Failed to create profile (auth user rolled back):', profileError.message)
  process.exit(1)
}

await supabase.from('audit_log').insert({
  user_id: created.user.id,
  action: 'user.invite',
  entity_type: 'profiles',
  entity_id: profile.id,
  metadata: { email, role: 'admin', source: 'bootstrap-script' },
})

console.log('Admin account created:')
console.log('  email:    ' + email)
console.log('  name:     ' + fullName)
console.log('  password: ' + password)
console.log('  id:       ' + created.user.id)