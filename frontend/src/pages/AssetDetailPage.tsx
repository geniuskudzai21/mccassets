import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  ClipboardList,
  Gauge,
  MapPin,
  Pencil,
  Trash2,
  Wrench,
  ShieldAlert,
  Tag,
  Coins,
  Box,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import { StatusBadge } from '../components/ui/StatusBadge.tsx'
import { Spinner } from '../components/ui/Loading.tsx'
import { useAsset, useAssetHistory } from '../hooks/useAssets.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { apiDelete } from '../lib/api.ts'
import { useToast } from '../components/ui/toast.tsx'
import { assetTypeLabel, formatCurrency, formatDate } from '../types/asset.ts'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const { asset, loading, error } = useAsset(id)
  const { timeline, loading: historyLoading, error: historyError } = useAssetHistory(id)
  const { toast, confirm } = useToast()
  const [deleting, setDeleting] = useState(false)

  const canEdit = role === 'supervisor' || role === 'admin'
  const canDelete = role === 'admin'

  const photos = useMemo(() => {
    if (!timeline) return []
    const seen = new Set<string>()
    const urls: { url: string; at: string }[] = []
    for (const entry of timeline) {
      if (entry.kind !== 'inspection' || !entry.item.photo_urls) continue
      for (const url of entry.item.photo_urls) {
        if (!seen.has(url)) {
          seen.add(url)
          urls.push({ url, at: entry.at })
        }
      }
    }
    return urls
  }, [timeline])

  async function handleDelete() {
    if (!asset) return
    const ok = await confirm({
      title: `Delete ${asset.asset_tag}?`,
      message: 'Its inspections, maintenance and transfer history will be removed. This cannot be undone.',
      confirmLabel: 'Delete asset',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await apiDelete(`/api/assets/${asset.id}`)
      toast({ kind: 'success', title: 'Asset deleted', message: `${asset.asset_tag} was removed from the register.` })
      navigate('/assets')
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not delete asset',
        message: err instanceof Error ? err.message : 'Failed to delete asset',
      })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Spinner size={18} /> Loading asset…
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-muted">{error ?? 'Asset not found'}</p>
        <div className="mt-4">
          <Link
            to="/assets"
            className="inline-flex items-center gap-2 text-sm font-medium text-council-teal hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to assets
          </Link>
        </div>
      </div>
    )
  }

  const infoRows: { label: string; value: string }[] = [
    { label: 'Type', value: assetTypeLabel[asset.type] ?? asset.type },
    { label: 'Make', value: asset.brand ?? '—' },
    { label: 'Model', value: asset.model ?? '—' },
    { label: 'Serial number', value: asset.serial_number ?? '—' },
    {
      label: 'Location',
      value: [asset.building, asset.room].filter(Boolean).join(', ') || '—',
    },
    { label: 'Department', value: asset.department_name ?? '—' },
    {
      label: 'Assigned user',
      value: asset.assigned_user_name ?? asset.assigned_user ?? '—',
    },
    { label: 'Purchase date', value: formatDate(asset.purchase_date) },
    { label: 'Purchase cost', value: formatCurrency(asset.purchase_cost) },
    { label: 'Useful life', value: `${asset.useful_life_years ?? '—'} years` },
    { label: 'Warranty expiry', value: formatDate(asset.warranty_expiry) },
    { label: 'Last updated', value: formatDate(asset.updated_at) },
  ]

  return (
    <div className="w-full py-2">
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-sm font-medium text-council-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to assets
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl font-semibold text-ink">{asset.asset_tag}</h2>
            <StatusBadge status={asset.current_status} />
            {typeof asset.functional === 'boolean' ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  asset.functional
                    ? 'border-status-good/40 bg-status-good/10 text-status-good'
                    : 'border-status-poor/40 bg-status-poor/10 text-status-poor'
                }`}
              >
                {asset.functional ? 'Functional' : 'Faulty'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {assetTypeLabel[asset.type] ?? asset.type}
            {asset.brand ? ` · ${asset.brand}` : ''}
            {asset.model ? ` ${asset.model}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/assets/${asset.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md bg-council-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Link>
          )}
          {canDelete && (
            <Button variant="outline" onClick={() => void handleDelete()} disabled={deleting}>
              <Trash2 className="h-4 w-4 text-status-poor" aria-hidden />
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="details-heading"
          className="rounded-md border border-line bg-paper p-5"
        >
          <h3
            id="details-heading"
            className="flex items-center gap-2 font-serif text-lg font-semibold text-ink"
          >
            <Tag className="h-4 w-4 text-council-teal" aria-hidden />
            Asset details
          </h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {infoRows.map((row) => (
              <div key={row.label}>
                <dt className="text-ink-muted">{row.label}</dt>
                <dd className="mt-0.5 font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-label="Activity timeline"
          className="rounded-md border border-line bg-paper p-5"
        >
          <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
            <ClipboardList className="h-4 w-4 text-council-teal" aria-hidden />
            Activity
          </h3>
          {historyLoading ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
              <Spinner size={16} /> Loading activity…
            </p>
          ) : historyError ? (
            <p role="alert" className="mt-4 text-sm text-status-poor">
              {historyError}
            </p>
          ) : timeline != null && timeline.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No inspections or maintenance recorded yet.
            </p>
          ) : timeline != null ? (
            <ul className="mt-4 space-y-4">
              {timeline.map((entry) => (
                <li key={`${entry.kind}-${entry.item.id}`} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line ${
                      entry.kind === 'inspection'
                        ? 'text-council-teal'
                        : entry.kind === 'transfer'
                          ? 'text-council-gold'
                          : 'text-status-fair'
                    }`}
                  >
                    {entry.kind === 'inspection' ? (
                      <ShieldAlert className="h-4 w-4" aria-hidden />
                    ) : entry.kind === 'transfer' ? (
                      <ArrowLeftRight className="h-4 w-4" aria-hidden />
                    ) : (
                      <Wrench className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {entry.kind === 'inspection'
                        ? 'Inspection'
                        : entry.kind === 'transfer'
                          ? 'Department transfer'
                          : 'Maintenance request'}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {formatDate(entry.at)} ·{' '}
                      {entry.kind === 'inspection' ? (
                        <StatusBadge status={entry.item.status} />
                      ) : entry.kind === 'transfer' ? (
                        <>
                          {entry.item.from_department_name ?? 'Unassigned'} →{' '}
                          {entry.item.to_department_name ?? 'Unassigned'}
                        </>
                      ) : (
                        entry.item.status
                      )}
                    </p>
                    {entry.kind === 'inspection' && entry.item.notes ? (
                      <p className="mt-1 text-sm text-ink-muted">{entry.item.notes}</p>
                    ) : null}
                    {entry.kind === 'inspection' &&
                    entry.item.photo_urls &&
                    entry.item.photo_urls.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.item.photo_urls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-16 w-16 overflow-hidden rounded-md border border-line focus:outline-none focus:ring-2 focus:ring-council-teal"
                          >
                            <img
                              src={url}
                              alt="Asset photo"
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {entry.kind === 'transfer' && entry.item.notes ? (
                      <p className="mt-1 text-sm text-ink-muted">{entry.item.notes}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <div className="mt-6 rounded-md border border-line bg-paper p-5">
        <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
          <Box className="h-4 w-4 text-council-teal" aria-hidden />
          Photos
        </h3>
        {photos.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {photos.map((photo) => (
              <a
                key={photo.url}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                title={`Open photo (${formatDate(photo.at)})`}
                className="block h-28 w-28 overflow-hidden rounded-md border border-line focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                <img
                  src={photo.url}
                  alt={`Asset photo from ${formatDate(photo.at)}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No photos captured yet.</p>
        )}
      </div>

      <div className="mt-6 rounded-md border border-line bg-paper p-5">
        <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
          <Gauge className="h-4 w-4 text-council-teal" aria-hidden />
          Condition & suitability
        </h3>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 text-ink-muted">
            <Box className="h-4 w-4" aria-hidden />
            <span>
              {asset.replacement_due
                ? `Replacement due — ${formatDate(asset.end_of_life)}`
                : `Replacement due ${formatDate(asset.end_of_life)} (in ${asset.days_to_end} day(s))`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <Coins className="h-4 w-4" aria-hidden />
            <span>Current value {formatCurrency(asset.current_value)}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <MapPin className="h-4 w-4" aria-hidden />
            <span>
              {asset.last_lat != null && asset.last_lng != null
                ? 'Located by GPS'
                : 'No GPS location'}
            </span>
          </div>
        </div>
        {typeof asset.functional === 'boolean' && !asset.functional ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {asset.functional_flags.map((flag) => (
              <li
                key={flag}
                className="inline-flex items-center gap-1.5 rounded-full border border-status-poor/30 bg-status-poor/5 px-2.5 py-1 text-xs text-status-poor"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {flag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {asset.parent_asset_id || asset.type === 'server' ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <Building2 className="h-4 w-4" aria-hidden />
          Component of another asset — parent management coming soon.
        </p>
      ) : null}
    </div>
  )
}
