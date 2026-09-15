import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'
import { apiGet, apiPatch, apiPost } from '../../lib/api.ts'
import { formatDate, assetTypeLabel } from '../../types/asset.ts'
import type { AssetStatus } from '../../types/db.ts'

interface DisposalRow {
  id: string
  asset_id: string
  reason: string
  disposal_date: string
  created_at: string
  asset: {
    id: string
    asset_tag: string
    brand: string | null
    model: string | null
    current_status: AssetStatus
  } | null
  disposed_by: { id: string; full_name: string } | null
  approved_by: { id: string; full_name: string } | null
}

interface DisposalsResponse {
  data: DisposalRow[]
}

interface AssetOption {
  id: string
  asset_tag: string
  type: string
  current_status: AssetStatus
  purchase_cost: number
}

export default function DisposalsPage() {
  const [disposals, setDisposals] = useState<DisposalRow[]>([])
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [form, setForm] = useState({ asset_id: '', reason: '', disposal_date: '' })

  function load() {
    Promise.all([
      apiGet<DisposalsResponse>('/api/admin/disposals'),
      apiGet<{ data: AssetOption[]; total: number }>('/api/assets?limit=100'),
    ])
      .then(([disposalResult, assetResult]) => {
        setDisposals(disposalResult.data)
        setAssets(assetResult.data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load disposals.')
      })
  }

  useEffect(() => {
    let active = true
    Promise.all([
      apiGet<DisposalsResponse>('/api/admin/disposals'),
      apiGet<{ data: AssetOption[]; total: number }>('/api/assets?limit=100'),
    ])
      .then(([disposalResult, assetResult]) => {
        if (active) {
          setDisposals(disposalResult.data)
          setAssets(assetResult.data)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load disposals.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await apiPost('/api/admin/disposals', {
        asset_id: form.asset_id,
        reason: form.reason,
        disposal_date: form.disposal_date || undefined,
      })
      setForm({ asset_id: '', reason: '', disposal_date: '' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the disposal.')
    } finally {
      setCreating(false)
    }
  }

  async function setApproval(disposal: DisposalRow, approve: boolean) {
    setBusyId(disposal.id)
    setError(null)
    try {
      await apiPatch(`/api/admin/disposals/${disposal.id}`, {
        action: approve ? 'approve' : 'revoke',
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update approval.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminPageShell
      title="Disposals workflow"
      description="Record asset disposals and manage approval."
    >
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-status-poor/30 bg-status-poor/10 px-3 py-2 text-sm text-status-poor"
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(event) => void submitCreate(event)}
        className="mb-6 rounded-md border border-line bg-paper p-5"
      >
        <h2 className="font-serif text-lg font-semibold text-ink">Record a disposal</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-ink">
            Asset
            <select
              required
              value={form.asset_id}
              onChange={(event) => setForm({ ...form, asset_id: event.target.value })}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_tag} — {assetTypeLabel[asset.type] ?? asset.type}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Disposal date
            <input
              type="date"
              value={form.disposal_date}
              onChange={(event) => setForm({ ...form, disposal_date: event.target.value })}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || form.asset_id === ''}
              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {creating ? 'Recording…' : 'Record disposal'}
            </button>
          </div>
        </div>
        <label className="mt-4 block text-sm font-medium text-ink">
          Reason
          <textarea
            required
            rows={2}
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            placeholder="Reason for disposal (condition, economical repair, obsolescence…)"
            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
          />
        </label>
      </form>

      <ul className="space-y-3">
        {disposals.map((disposal) => {
          const pending = disposal.approved_by === null
          const busy = busyId === disposal.id
          return (
            <li key={disposal.id} className="rounded-md border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {disposal.asset ? disposal.asset.asset_tag : 'Unknown asset'}
                    {disposal.asset?.brand ? (
                      <span className="ml-2 text-sm font-normal text-ink-muted">
                        {disposal.asset.brand}
                        {disposal.asset.model ? ` ${disposal.asset.model}` : ''}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{disposal.reason}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {formatDate(disposal.disposal_date)}
                    {disposal.disposed_by ? ` · Recorded by ${disposal.disposed_by.full_name}` : ''}
                    {disposal.approved_by ? (
                      <> · Approved by {disposal.approved_by.full_name}</>
                    ) : (
                      ' · Awaiting approval'
                    )}
                  </p>
                </div>
                {pending ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setApproval(disposal, true)}
                    className="rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setApproval(disposal, false)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
                  >
                    Revoke approval
                  </button>
                )}
              </div>
              {disposal.asset ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Current status:{' '}
                  <span className="capitalize">{disposal.asset.current_status}</span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      {disposals.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No disposals recorded yet.
        </p>
      ) : null}
    </AdminPageShell>
  )
}
