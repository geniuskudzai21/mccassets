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
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
        <h1 className="font-serif text-xl font-semibold">Supervisor dashboard</h1>
        <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <LayoutDashboard className="h-4 w-4 text-council-teal" aria-hidden />
          {stats ? `${stats.total} assets` : 'Overview'}
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error ? (
          <p role="alert" className="text-sm text-status-poor">
            {error}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-md border border-line bg-paper p-5">
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

          <section className="rounded-md border border-line bg-paper p-5 lg:col-span-2">
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
