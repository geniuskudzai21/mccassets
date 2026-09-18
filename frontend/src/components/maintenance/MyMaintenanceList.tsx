import { useEffect, useState } from 'react'
import { CheckCircle2, Wrench } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications.ts'
import { apiGet, apiPost } from '../../lib/api.ts'
import { notifyNotificationsChanged } from '../../lib/notificationsBus.ts'
import { formatDate } from '../../types/asset.ts'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '../../lib/status.ts'
import type { MaintenanceRequestRow } from '../maintenance/MaintenanceList.tsx'

export function MyMaintenanceList() {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set())
  const { refresh } = useNotifications()

  useEffect(() => {
    let active = true
    apiGet<{ data: MaintenanceRequestRow[] }>('/api/maintenance-requests?limit=30')
      .then((result) => {
        if (active) {
          setRequests(result.data)
          setLoaded(true)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setLoaded(true)
          setError(err instanceof Error ? err.message : 'Could not load your tasks.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function handleAcknowledge(id: string) {
    setAcknowledging((previous) => new Set(previous).add(id))
    try {
      const result = await apiPost<{ data: MaintenanceRequestRow }>(
        `/api/maintenance-requests/${id}/acknowledge`,
        {},
      )
      setRequests((current) => current.map((request) => (request.id === id ? result.data : request)))
      notifyNotificationsChanged()
      void refresh()
    } catch {
      /* acknowledge is best-effort; the row stays interactive */
    } finally {
      setAcknowledging((previous) => {
        const next = new Set(previous)
        next.delete(id)
        return next
      })
    }
  }

  const loading = !loaded && error === null

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading your tasks…</p>
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-status-poor">
        {error}
      </p>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line p-8 text-center">
        <Wrench className="h-6 w-6 text-ink-muted" aria-hidden />
        <p className="text-sm text-ink-muted">
          No maintenance tasks assigned to you yet. Assigned fault repairs will appear here.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {requests.map((request) => {
        const isAcknowledged = request.acknowledged_at !== null
        const isWorking = acknowledging.has(request.id)
        return (
          <li key={request.id} className="rounded-md border border-line bg-paper p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">
                {request.asset?.asset_tag ?? 'Unknown asset'}
              </p>
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
            <p className="mt-1 text-sm text-ink-muted">{request.description}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">Raised {formatDate(request.created_at)}</p>
              {isAcknowledged ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-status-good">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Acknowledged
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleAcknowledge(request.id)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-1 rounded-md border border-council-teal px-2.5 py-1 text-xs font-medium text-council-teal transition-colors hover:bg-council-teal focus:outline-none focus:ring-2 focus:ring-council-teal disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {isWorking ? 'Acknowledging…' : 'Acknowledge'}
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}