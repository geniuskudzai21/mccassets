import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { apiGet } from '../../lib/api.ts'
import { formatDate } from '../../types/asset.ts'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '../../lib/status.ts'
import type { MaintenanceRequestRow } from '../maintenance/MaintenanceList.tsx'

export function MyMaintenanceList() {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      {requests.map((request) => (
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
          <p className="mt-1 text-xs text-ink-muted">Raised {formatDate(request.created_at)}</p>
        </li>
      ))}
    </ul>
  )
}