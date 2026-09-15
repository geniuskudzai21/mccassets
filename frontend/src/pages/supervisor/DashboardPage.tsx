import { useEffect, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { AssetsMap } from '../../components/supervisor/AssetsMap.tsx'
import {
  StatusBreakdownChart,
  type StatusBreakdown,
} from '../../components/supervisor/StatusBreakdownChart.tsx'
import type { LocationInfo } from '../../components/supervisor/types.ts'
import { MaintenanceList } from '../../components/maintenance/MaintenanceList.tsx'
import { apiGet } from '../../lib/api.ts'

interface AssetStatsResponse {
  data: {
    total: number
    by_status: StatusBreakdown
    located: LocationInfo[]
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AssetStatsResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    apiGet<AssetStatsResponse>('/api/assets/stats')
      .then((result) => {
        if (active) setStats(result.data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load the dashboard.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const loading = stats === null && error === null

  return (
    <div className="w-full text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper py-4">
        <h1 className="font-serif text-xl font-semibold">Supervisor dashboard</h1>
        <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <LayoutDashboard className="h-4 w-4 text-council-teal" aria-hidden />
          {stats ? `${stats.total} assets` : 'Overview'}
        </span>
      </header>

      <main className="w-full py-6">
        {error ? (
          <p role="alert" className="text-sm text-status-poor">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section className="min-w-0 rounded-md border border-line bg-paper p-5">
            <h2 className="font-serif text-lg font-semibold text-ink">Status breakdown</h2>
            <p className="mb-4 mt-0.5 text-sm text-ink-muted">
              Asset register by current condition.
            </p>
            {stats ? (
              <StatusBreakdownChart stats={stats.by_status} />
            ) : (
              <p className="text-sm text-ink-muted">{loading ? 'Loading…' : 'Unavailable.'}</p>
            )}
          </section>

          <section className="min-w-0 rounded-md border border-line bg-paper p-5">
            <h2 className="font-serif text-lg font-semibold text-ink">Assets map</h2>
            <p className="mb-4 mt-0.5 text-sm text-ink-muted">
              Geolocated assets, colored by status.
            </p>
            {stats ? (
              <AssetsMap assets={stats.located} />
            ) : (
              <p className="text-sm text-ink-muted">{loading ? 'Loading…' : 'Unavailable.'}</p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-md border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Maintenance requests</h2>
          <p className="mb-4 mt-0.5 text-sm text-ink-muted">
            Approve, assign, and track work raised by inspections.
          </p>
          <MaintenanceList />
        </section>
      </main>
    </div>
  )
}
