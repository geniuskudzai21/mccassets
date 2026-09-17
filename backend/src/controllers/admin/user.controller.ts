import type { Request, Response } from 'express'
import { getSupabase } from '../../config/supabase.js'
import { HttpError } from '../../middleware/errorHandler.js'
import { inviteUserSchema, updateUserSchema } from '../../schemas/admin.schema.js'
import type { Profile } from '../../types/db.js'

type ProfileRow = Profile['Row']

function userIdParam(req: Request): string {
  const value = req.params.id
  if (typeof value !== 'string') {
    throw new HttpError(404, 'User not found')
  }
  return value
}

export async function listUsers(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data: profiles, error } = await supabase.from('profiles').select('*')

  if (error) {
    throw new HttpError(500, 'Failed to load users')
  }

  const departmentIds = [
    ...new Set(profiles?.map((p) => p.department_id).filter(Boolean) as string[]),
  ]
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', departmentIds)

  if (deptError) {
    throw new HttpError(500, 'Failed to load departments')
  }

  const departmentsById = new Map((departments ?? []).map((d) => [d.id, d]))

  res.json({
    data: (profiles ?? []).map((profile) => ({
      ...profile,
      department: profile.department_id
        ? (departmentsById.get(profile.department_id) ?? null)
        : null,
    })),
  })
}

export async function inviteUser(req: Request, res: Response) {
  const body = inviteUserSchema.parse(req.body)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const existing = await supabase
    .from('profiles')
    .select('id')
    .eq('email', body.email)
    .maybeSingle()
  if (existing.data || existing.error?.code === '23505') {
    throw new HttpError(409, 'A user with that email already exists')
  }
  if (existing.error) {
    throw new HttpError(500, 'Failed to check for existing user')
  }

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name },
  })

  if (authError) {
    throw new HttpError(500, authError.message ?? 'Failed to create auth user')
  }
  if (!created?.user) {
    throw new HttpError(500, 'Auth user creation returned no user')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: created.user.id,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      department_id: body.department_id ?? null,
      phone: body.phone ?? null,
      is_active: true,
    })
    .select('*')
    .single()

  if (profileError) {
    await supabase.auth.admin.deleteUser(created.user.id)
    throw new HttpError(500, 'Failed to create user profile')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'user.invite',
    entity_type: 'profiles',
    entity_id: profile.id,
    metadata: { email: body.email, role: body.role },
  })

  res.status(201).json({ data: profile as ProfileRow })
}

export async function deleteUser(req: Request, res: Response) {
  const id = userIdParam(req)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    throw new HttpError(500, 'Failed to load user')
  }
  if (!existing) {
    throw new HttpError(404, 'User not found')
  }

  if (id === actorId) {
    throw new HttpError(400, 'You cannot delete your own account')
  }

  if (existing.role === 'admin') {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)

    if (countError) {
      throw new HttpError(500, 'Failed to check remaining admins')
    }
    if (count !== null && count <= 1) {
      throw new HttpError(400, 'Cannot delete the last active admin')
    }
  }

  const { error: inspectionError } = await supabase
    .from('inspections')
    .delete()
    .eq('technician_id', id)
  if (inspectionError) {
    throw new HttpError(500, 'Failed to remove the user\'s inspections')
  }

  const { error: maintenanceError } = await supabase
    .from('maintenance_requests')
    .update({ raised_by: null, assigned_to: null })
    .or(`raised_by.eq.${id},assigned_to.eq.${id}`)
  if (maintenanceError) {
    throw new HttpError(500, 'Failed to detach the user\'s maintenance requests')
  }

  const { error: disposalError } = await supabase
    .from('disposals')
    .update({ disposed_by: null, approved_by: null })
    .or(`disposed_by.eq.${id},approved_by.eq.${id}`)
  if (disposalError) {
    throw new HttpError(500, 'Failed to detach the user\'s disposals')
  }

  const { error: auditError } = await supabase
    .from('audit_log')
    .update({ user_id: null })
    .eq('user_id', id)
  if (auditError) {
    throw new HttpError(500, 'Failed to clear the user\'s audit trail')
  }

  const { error: profileError } = await supabase.from('profiles').delete().eq('id', id)
  if (profileError) {
    throw new HttpError(500, 'Failed to delete user profile')
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) {
    throw new HttpError(500, 'User profile deleted but auth account could not be removed')
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'user.delete',
    entity_type: 'profiles',
    entity_id: id,
    metadata: { email: existing.email ?? null, role: existing.role },
  })

  res.status(204).end()
}

export async function updateUser(req: Request, res: Response) {
  const id = userIdParam(req)
  const body = updateUserSchema.parse(req.body)
  const supabase = getSupabase()
  const actorId = req.user?.id

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    throw new HttpError(500, 'Failed to load user')
  }
  if (!existing) {
    throw new HttpError(404, 'User not found')
  }

  if (id === actorId) {
    if (body.is_active === false) {
      throw new HttpError(400, 'You cannot deactivate your own account')
    }
  }

  const patch: Profile['Update'] = {}
  if (body.full_name !== undefined) patch.full_name = body.full_name
  if (body.role !== undefined) patch.role = body.role
  if (body.department_id !== undefined) patch.department_id = body.department_id
  if (body.phone !== undefined) patch.phone = body.phone
  if (body.is_active !== undefined) patch.is_active = body.is_active

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'Nothing to update')
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new HttpError(500, 'Failed to update user')
  }

  const banChanged = body.is_active !== undefined && body.is_active !== existing.is_active
  if (banChanged) {
    const { error: banError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: body.is_active ? 'none' : '876000h',
    })
    if (banError) {
      throw new HttpError(500, 'User profile updated but auth state could not be changed')
    }
  }

  await supabase.from('audit_log').insert({
    user_id: actorId,
    action: 'user.update',
    entity_type: 'profiles',
    entity_id: id,
    metadata: body as Record<string, unknown>,
  })

  res.json({ data: updated as ProfileRow })
}
