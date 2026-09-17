import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { UserRole } from '../../types/db.ts'
import type { DepartmentRow } from '../../types/asset.ts'

interface ManagedUser {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  department_id: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  department: { id: string; name: string } | null
}

interface UsersResponse {
  data: ManagedUser[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  technician: 'Technician',
  supervisor: 'Supervisor',
  admin: 'Admin',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'technician' as UserRole,
    department_id: '',
    phone: '',
  })
  const [inviting, setInviting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function load() {
    Promise.all([
      apiGet<UsersResponse>('/api/admin/users'),
      apiGet<{ data: DepartmentRow[] }>('/api/departments'),
    ])
      .then(([userResult, deptResult]) => {
        setUsers(userResult.data)
        setDepartments(deptResult.data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load users.')
      })
  }

  useEffect(() => {
    let active = true
    Promise.all([
      apiGet<UsersResponse>('/api/admin/users'),
      apiGet<{ data: DepartmentRow[] }>('/api/departments'),
    ])
      .then(([userResult, deptResult]) => {
        if (active) {
          setUsers(userResult.data)
          setDepartments(deptResult.data)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load users.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviting(true)
    setError(null)
    try {
      await apiPost('/api/admin/users', {
        full_name: invite.full_name,
        email: invite.email,
        password: invite.password,
        role: invite.role,
        department_id: invite.department_id || null,
        phone: invite.phone || null,
      })
      setInvite({
        full_name: '',
        email: '',
        password: '',
        role: 'technician',
        department_id: '',
        phone: '',
      })
      setShowInvite(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite the user.')
    } finally {
      setInviting(false)
    }
  }

  async function saveEdit(user: ManagedUser) {
    setError(null)
    try {
      const patch: Partial<ManagedUser> = {}
      if (user.full_name !== undefined) patch.full_name = user.full_name
      if (user.role !== undefined) patch.role = user.role
      if (user.department_id !== undefined) patch.department_id = user.department_id
      if (user.phone !== undefined) patch.phone = user.phone || null
      await apiPatch(`/api/admin/users/${user.id}`, patch)
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    }
  }

  async function toggleActive(user: ManagedUser) {
    setError(null)
    try {
      await apiPatch(`/api/admin/users/${user.id}`, { is_active: !user.is_active })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change activation.')
    }
  }

  async function deleteUser(user: ManagedUser) {
    if (
      !window.confirm(
        `Delete ${user.full_name} (${user.email ?? 'no email'})?\n\nTheir inspections are removed and login access is revoked. This cannot be undone.`,
      )
    ) {
      return
    }
    setError(null)
    try {
      await apiDelete(`/api/admin/users/${user.id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the user.')
    }
  }

  function updateLocalUser(id: string, patch: Partial<ManagedUser>) {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...patch } : user)))
  }

  return (
    <AdminPageShell
      title="User management"
      description="Invite staff, assign roles and departments, and control access."
      actions={
        <button
          type="button"
          onClick={() => setShowInvite((value) => !value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Invite user
        </button>
      }
    >
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-status-poor/30 bg-status-poor/10 px-3 py-2 text-sm text-status-poor"
        >
          {error}
        </p>
      ) : null}

      {showInvite ? (
        <form
          onSubmit={(event) => void submitInvite(event)}
          className="mb-6 rounded-md border border-line bg-paper p-5"
        >
          <h2 className="font-serif text-lg font-semibold text-ink">Add a new user</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink">
              Full name
              <input
                required
                value={invite.full_name}
                onChange={(event) => setInvite({ ...invite, full_name: event.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                required
                type="email"
                value={invite.email}
                onChange={(event) => setInvite({ ...invite, email: event.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Password
              <input
                required
                type="password"
                minLength={8}
                value={invite.password}
                onChange={(event) => setInvite({ ...invite, password: event.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Role
              <select
                value={invite.role}
                onChange={(event) => setInvite({ ...invite, role: event.target.value as UserRole })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                <option value="technician">Technician</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              Department
              <select
                value={invite.department_id}
                onChange={(event) => setInvite({ ...invite, department_id: event.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              Phone
              <input
                value={invite.phone}
                onChange={(event) => setInvite({ ...invite, phone: event.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-md bg-council-teal px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
            >
              {inviting ? 'Adding…' : 'Add user'}
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {users.map((user) => {
          const editing = editingId === user.id
          const isSelf = user.id === currentUser?.id
          return (
            <li key={user.id} className="rounded-md border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {user.full_name}
                    {isSelf ? <span className="ml-2 text-sm text-ink-muted">(you)</span> : null}
                  </p>
                  <p className="text-sm text-ink-muted">{user.email ?? 'No email recorded'}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    <span
                      className={`inline-flex rounded-full border border-line px-2 py-0.5 text-xs font-medium ${
                        user.is_active ? 'text-status-good' : 'text-ink-muted'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </span>
                    <span className="ml-2">{ROLE_LABELS[user.role]}</span>
                    {user.department ? (
                      <span className="ml-2">· {user.department.name}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => void saveEdit(user)}
                      className="rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(user.id)}
                      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      Edit
                    </button>
                  )}
                  {!isSelf ? (
                    <button
                      type="button"
                      onClick={() => void toggleActive(user)}
                      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  ) : null}
                  {!isSelf ? (
                    <button
                      type="button"
                      onClick={() => void deleteUser(user)}
                      className="rounded-md border border-status-poor/40 px-3 py-1.5 text-sm font-medium text-status-poor transition-colors hover:bg-status-poor/10 focus:outline-none focus:ring-2 focus:ring-status-poor"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              {editing ? (
                <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    Full name
                    <input
                      value={user.full_name}
                      onChange={(event) =>
                        updateLocalUser(user.id, { full_name: event.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Email (sign-in)
                    <input
                      type="email"
                      disabled
                      value={user.email ?? ''}
                      placeholder="No email recorded"
                      className="mt-1 w-full cursor-not-allowed rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink opacity-70 placeholder:text-ink-muted"
                    />
                    <span className="mt-1 block text-xs text-ink-muted">
                      Email is the sign-in and cannot be changed here.
                    </span>
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Role
                    <select
                      value={user.role}
                      onChange={(event) =>
                        updateLocalUser(user.id, { role: event.target.value as UserRole })
                      }
                      className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Department
                    <select
                      value={user.department_id ?? ''}
                      onChange={(event) =>
                        updateLocalUser(user.id, { department_id: event.target.value || null })
                      }
                      className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      <option value="">No department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Phone
                    <input
                      value={user.phone ?? ''}
                      onChange={(event) => updateLocalUser(user.id, { phone: event.target.value })}
                      className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
                    />
                  </label>
                  <div className="block text-sm font-medium text-ink">
                    Created
                    <p className="mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-muted">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {users.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No users yet.
        </p>
      ) : null}
    </AdminPageShell>
  )
}
