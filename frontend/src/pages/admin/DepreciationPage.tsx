import { useEffect, useState } from 'react'
import { Search, TrendingDown } from 'lucide-react'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'
import { SkeletonRows } from '../../components/ui/Loading.tsx'
import { apiGet } from '../../lib/api.ts'
import { formatCurrency, formatDate } from '../../types/asset.ts'
import type { DepreciationRow } from '../../lib/reports.ts'

interface DepreciationResponse {
  data: {
    as_of: string
    total_value: number
    rows: DepreciationRow[]
  }
}

export default function DepreciationPage() {
  const [rows, setRows] = useState<DepreciationRow[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [asOf, setAsOf] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [replacementOnly, setReplacementOnly] = useState(false)

  useEffect(() => {
    let active = true
    apiGet<DepreciationResponse>('/api/admin/reports/depreciation')
      .then((result) => {
        if (active) {
          setRows(result.data.rows)
          setTotalValue(result.data.total_value)
          setAsOf(result.data.as_of)
          setLoaded(true)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setLoaded(true)
          setError(err instanceof Error ? err.message : 'Could not load depreciation.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const needle = query.trim().toLowerCase()
  const filtered = rows.filter((row) => {
    const matchesQuery =
      needle === '' ||
      row.asset_tag.toLowerCase().includes(needle) ||
      (row.department ?? '').toLowerCase().includes(needle)
    return matchesQuery && (!replacementOnly || row.replacement_due)
  })

  const totalCost = filtered.reduce((sum, row) => sum + row.purchase_cost, 0)
  const accumulated = totalCost - filtered.reduce((sum, row) => sum + row.current_value, 0)
  const replacementDue = filtered.filter((row) => row.replacement_due).length

  return (
    <AdminPageShell
      title="Depreciation"
      description="Asset book values, annual depreciation and replacement forecasting."
    >
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-status-poor/30 bg-status-poor/10 px-3 py-2 text-sm text-status-poor"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Assets</p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink tabular-nums">
            {filtered.length}
          </p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Purchase cost</p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink tabular-nums">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Accumulated depreciation</p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink tabular-nums">
            {formatCurrency(accumulated)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Current book value</p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink tabular-nums">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Replacement due</p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink tabular-nums">
            {replacementDue}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-sm text-sm">
          <span className="sr-only">Search assets</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search asset tag or department"
            className="w-full rounded-md border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={replacementOnly}
            onChange={(event) => setReplacementOnly(event.target.checked)}
            className="h-4 w-4 rounded border-line text-council-teal focus:ring-council-teal"
          />
          Replacement due only
        </label>
      </div>

      <section className="mt-4 rounded-md border border-line bg-paper p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink">Depreciation schedule</h2>
          <p className="text-sm text-ink-muted">
            As of {asOf ? formatDate(asOf) : '-'}
          </p>
        </div>

        {!loaded && error === null ? (
          <div className="mt-4">
            <SkeletonRows rows={5} />
          </div>
        ) : null}

        {loaded && error === null && rows.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-line p-8 text-center text-sm text-ink-muted">
            No assets to depreciate yet.
          </p>
        ) : null}

        {loaded && error === null && rows.length > 0 && filtered.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-line p-8 text-center text-sm text-ink-muted">
            No assets match your filters.
          </p>
        ) : null}

        {filtered.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Asset</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Purchased</th>
                  <th className="py-2 pr-3 font-medium text-right">Useful life</th>
                  <th className="py-2 pr-3 font-medium">End of life</th>
                  <th className="py-2 pr-3 font-medium text-right">Cost</th>
                  <th className="py-2 pr-3 font-medium text-right">Annual dep.</th>
                  <th className="py-2 pr-3 font-medium text-right">Accumulated</th>
                  <th className="py-2 pr-3 font-medium text-right">Current value</th>
                  <th className="py-2 font-medium text-right">Replacement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-line text-ink">
                    <td className="py-2 pr-3 font-medium">{row.asset_tag}</td>
                    <td className="py-2 pr-3 text-ink-muted">{row.department ?? '-'}</td>
                    <td className="py-2 pr-3 text-ink-muted">{formatDate(row.purchase_date)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {row.useful_life_years} yr{row.useful_life_years === 1 ? '' : 's'}
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">{formatDate(row.end_of_life)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatCurrency(row.purchase_cost)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatCurrency(row.annual_depreciation)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatCurrency(row.purchase_cost - row.current_value)}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium tabular-nums">
                      {formatCurrency(row.current_value)}
                    </td>
                    <td className="py-2 text-right">
                      {row.replacement_due ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-poor/10 px-2 py-0.5 text-xs font-medium text-status-poor">
                          <TrendingDown className="h-3 w-3" aria-hidden />
                          Due
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminPageShell>
  )
}
