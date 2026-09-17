import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { apiGet, apiPatch } from '../../lib/api.ts'
import { formatDate } from '../../types/asset.ts'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '../../lib/status.ts'

export interface MaintenanceLink {
  id: string
  asset_tag: string
  type: string
  current_status: string
}

export interface MaintenanceRequestRow {
  id: string
  asset_id: string
  raised_by: string | null
  assigned_to: string | null
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  description: string
  estimated_cost: number | null
  created_at: string
  resolved_at: string | null
  asset: MaintenanceLink | null
  assignee: { id: string; full_name: string; role: string } | null
}

interface ListResponse {
  data: MaintenanceRequestRow[]
  total: number
}

interface User {
  id: string
  full_name: string
}

export function MaintenanceList() {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiGet<ListResponse>('/api/maintenance-requests?limit=50'),
      apiGet<{ data: User[] }>('/api/users?role=technician'),
    ])
      .then(([maintenance, users]) => {
        if (active) {
          setRequests(maintenance.data)
          setTechnicians(users.data)
          setLoaded(true)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setLoaded(true)
          setError(err instanceof Error ? err.message : 'Could not load maintenance requests.')
        }
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  function refresh() {
    setRefreshKey((key) => key + 1)
  }

  async function update(id: string, body: { status?: string; assigned_to?: string | null }) {
    setBusyId(id)
    try {
      await apiPatch(`/api/maintenance-requests/${id}`, body)
      refresh()
    } catch {
      setError('Could not update the maintenance request.')
    } finally {
      setBusyId(null)
    }
  }

  const loading = !loaded && error === null

  function actionButtons(request: MaintenanceRequestRow) {
    const disabled = busyId === request.id
    switch (request.status) {
      case 'pending':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => void update(request.id, { status: 'approved' })}
              className="rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void update(request.id, { status: 'rejected' })}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )
      case 'approved':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <SelectAssignee
              value={request.assigned_to}
              technicians={technicians}
              disabled={disabled}
              onChange={(id) => void update(request.id, { assigned_to: id })}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => void update(request.id, { status: 'in_progress' })}
              className="rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
            >
              Start
            </button>
          </div>
        )
      case 'in_progress':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <SelectAssignee
              value={request.assigned_to}
              technicians={technicians}
              disabled={disabled}
              onChange={(id) => void update(request.id, { assigned_to: id })}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => void update(request.id, { status: 'completed' })}
              className="rounded-md bg-status-good px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-status-good focus:ring-offset-1 disabled:opacity-50"
            >
              Mark complete
            </button>
          </div>
        )
      case 'completed':
        return (
          <p className="text-sm text-ink-muted">
            Resolved {request.resolved_at ? formatDate(request.resolved_at) : ''}
          </p>
        )
      case 'rejected':
        return (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void update(request.id, { status: 'pending' })}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
          >
            Reopen
          </button>
        )
    }
  }

  return (
    <div>
      {loading ? (
        <p className="text-sm text-ink-muted">Loading maintenance requests…</p>
      ) : error ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="alert" className="text-sm text-status-poor">
            {error}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            Retry
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line p-8 text-center">
          <Wrench className="h-6 w-6 text-ink-muted" aria-hidden />
          <p className="text-sm text-ink-muted">
            No maintenance requests yet. They are created automatically when an inspection records
            an asset as poor or for disposal.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li key={request.id} className="rounded-md border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {request.asset?.asset_tag ?? 'Unknown asset'}
                    {request.asset ? (
                      <span className="ml-2 text-sm font-normal text-ink-muted">
                        {request.asset.type}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{request.description}</p>
                </div>
                <span
                  className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-xs font-medium"
                  style={{
                    color: REQUEST_STATUS_COLORS[request.status] ?? '#6B6B65',
                    borderColor: `${REQUEST_STATUS_COLORS[request.status] ?? '#6B6B65'}40`,
                    backgroundColor: `${REQUEST_STATUS_COLORS[request.status] ?? '#6B6B65'}14`,
                  }}
                >
                  {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  Raised {formatDate(request.created_at)}
                  {request.assignee ? (
                    <>
                      {' '}
                      · Assigned to{' '}
                      <span className="font-medium text-ink">{request.assignee.full_name}</span>
                    </>
                  ) : null}
                </p>
                {actionButtons(request)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SelectAssignee({
  value,
  technicians,
  disabled,
  onChange,
}: {
  value: string | null
  technicians: User[]
  disabled: boolean
  onChange: (id: string | null) => void
}) {
  return (
    <select
      aria-label="Assign technician"
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      className="min-h-9 rounded-md border border-line bg-paper px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {technicians.map((technician) => (
        <option key={technician.id} value={technician.id}>
          {technician.full_name}
        </option>
      ))}
    </select>
  )
}
