import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState.tsx'
import { StatusBadge } from '../../components/ui/StatusBadge.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { api } from '../../lib/api.ts'
import { assetTypeLabel, formatDate } from '../../types/asset.ts'
import type { AssetRow } from '../../types/asset.ts'

interface InspectionEntry {
  id: string
  asset_id: string
  technician_id: string
  status: 'good' | 'fair' | 'poor' | 'disposal'
  notes: string | null
  inspected_at: string
}

export default function MyInspectionsPage() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<InspectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [assets, setAssets] = useState<Record<string, AssetRow>>({})

  useEffect(() => {
    if (!user) return
    let active = true
    api<{ data: InspectionEntry[] }>(`/api/inspections?technician_id=${user.id}`)
      .then((result) => {
        if (!active) return
        setInspections(result.data)
        setError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load inspections.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user, refreshKey])

  useEffect(() => {
    if (inspections.length === 0) return
    let active = true
    const uniqueAssetIds = [...new Set(inspections.map((i) => i.asset_id))]

    Promise.all(
      uniqueAssetIds.map((id) => api<{ data: AssetRow }>(`/api/assets/${id}`).catch(() => null)),
    ).then((results) => {
      if (!active) return
      const record: Record<string, AssetRow> = {}
      results.forEach((result) => {
        if (result?.data) {
          record[result.data.id] = result.data
        }
      })
      setAssets(record)
    })

    return () => {
      active = false
    }
  }, [inspections])

  return (
    <div className="px-4 py-5">
      <h2 className="font-serif text-xl font-semibold text-ink">My inspections</h2>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Loading…</div>
      ) : error ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Could not load inspections"
          description={error}
          action={
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError(null)
                setRefreshKey((key) => key + 1)
              }}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              Retry
            </button>
          }
        />
      ) : inspections.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="No inspections yet"
          description="Scan an asset to record your first inspection."
          action={
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-md bg-council-teal px-4 py-2 text-sm font-medium text-white hover:bg-council-teal/90"
            >
              Start inspection
            </Link>
          }
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {inspections.map((inspection) => {
            const asset = assets[inspection.asset_id]
            return (
              <li
                key={inspection.id}
                className="flex items-center gap-3 rounded-md border border-line bg-white p-4 shadow-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-ink">{asset?.asset_tag ?? 'Loading…'}</p>
                  <p className="text-sm text-ink-muted">
                    {asset ? `${assetTypeLabel[asset.type] ?? asset.type} · ` : ''}
                    {formatDate(inspection.inspected_at)}
                  </p>
                </div>
                <StatusBadge status={inspection.status} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
