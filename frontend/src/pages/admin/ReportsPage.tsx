import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'
import { apiGet } from '../../lib/api.ts'
import {
  buildAssetReportPdf,
  type DepreciationRow,
  type ReplacementDueRow,
  type SummaryReportData,
} from '../../lib/reports.ts'
import { formatCurrency } from '../../types/asset.ts'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/status.ts'
import type { AssetStatus } from '../../types/db.ts'

interface SummaryResponse {
  data: SummaryReportData
}

interface DepreciationResponse {
  data: {
    as_of: string
    total_value: number
    rows: DepreciationRow[]
  }
}

interface ReplacementResponse {
  data: {
    as_of: string
    count: number
    rows: ReplacementDueRow[]
  }
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryReportData | null>(null)
  const [depreciation, setDepreciation] = useState<DepreciationRow[] | null>(null)
  const [replacement, setReplacement] = useState<ReplacementDueRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiGet<SummaryResponse>('/api/admin/reports/summary'),
      apiGet<DepreciationResponse>('/api/admin/reports/depreciation'),
      apiGet<ReplacementResponse>('/api/admin/reports/replacement-due'),
    ])
      .then(([summaryResult, depreciationResult, replacementResult]) => {
        if (active) {
          setSummary(summaryResult.data)
          setDepreciation(depreciationResult.data.rows)
          setReplacement(replacementResult.data.rows)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load reports.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const loading = summary === null || depreciation === null || replacement === null

  function exportPdf() {
    if (!summary || !depreciation || !replacement) return
    buildAssetReportPdf({ summary, depreciation, replacement })
  }

  return (
    <AdminPageShell
      title="Reports"
      description="Register summaries, depreciation and replacement forecasting."
      actions={
        <button
          type="button"
          onClick={exportPdf}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" aria-hidden />
          Export PDF
        </button>
      }
    >
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-status-poor/30 bg-status-poor/10 px-3 py-2 text-sm text-status-poor"
        >
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-ink-muted">Loading reports…</p> : null}

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-line bg-paper p-4">
            <p className="text-sm text-ink-muted">Total assets</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink">{summary.total}</p>
          </div>
          <div className="rounded-md border border-line bg-paper p-4">
            <p className="text-sm text-ink-muted">Replacement value</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink tabular-nums">
              {formatCurrency(summary.total_value)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-paper p-4">
            <p className="text-sm text-ink-muted">Open maintenance</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink">
              {summary.open_maintenance}
            </p>
          </div>
          <div className="rounded-md border border-line bg-paper p-4">
            <p className="text-sm text-ink-muted">Inspections (30d)</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink">
              {summary.inspections_last_30d}
            </p>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-line bg-paper p-5">
            <h2 className="font-serif text-lg font-semibold text-ink">By status</h2>
            <ul className="mt-3 space-y-2">
              {(Object.keys(summary.by_status) as AssetStatus[]).map((status) => (
                <li key={status} className="flex items-center gap-2 text-sm text-ink">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                    aria-hidden
                  />
                  <span className="flex-1">{STATUS_LABELS[status]}</span>
                  <span className="font-medium tabular-nums text-ink-muted">
                    {summary.by_status[status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-paper p-5">
            <h2 className="font-serif text-lg font-semibold text-ink">By department</h2>
            {summary.by_department.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {summary.by_department.map(({ name, count }) => (
                  <li key={name} className="flex items-center justify-between text-sm text-ink">
                    <span className="flex-1">{name}</span>
                    <span className="font-medium tabular-nums text-ink-muted">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No assets assigned to departments.</p>
            )}
          </div>
        </section>
      ) : null}

      {depreciation ? (
        <section className="mt-4 rounded-md border border-line bg-paper p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-lg font-semibold text-ink">Depreciation table</h2>
            {depreciation.length > 0 ? (
              <p className="text-sm text-ink-muted tabular-nums">
                Book value {formatCurrency(summary?.total_value ?? 0)} · Depreciated{' '}
                {formatCurrency(depreciation.reduce((sum, row) => sum + row.current_value, 0))}
              </p>
            ) : null}
          </div>
          {depreciation.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Asset</th>
                    <th className="py-2 pr-3 font-medium">Department</th>
                    <th className="py-2 pr-3 font-medium">Purchased</th>
                    <th className="py-2 pr-3 font-medium text-right">Cost</th>
                    <th className="py-2 pr-3 font-medium text-right">Annual dep.</th>
                    <th className="py-2 font-medium text-right">Current value</th>
                  </tr>
                </thead>
                <tbody>
                  {depreciation.map((row) => (
                    <tr key={row.id} className="border-b border-line text-ink">
                      <td className="py-2 pr-3">{row.asset_tag}</td>
                      <td className="py-2 pr-3 text-ink-muted">{row.department ?? '—'}</td>
                      <td className="py-2 pr-3 text-ink-muted">{row.purchase_date}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatCurrency(row.purchase_cost)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatCurrency(row.annual_depreciation)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">
                        {formatCurrency(row.current_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No assets to depreciate yet.</p>
          )}
        </section>
      ) : null}

      {replacement ? (
        <section className="mt-4 rounded-md border border-line bg-paper p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-lg font-semibold text-ink">Replacement due</h2>
            <p className="text-sm text-ink-muted">{replacement.length} assets within the horizon</p>
          </div>
          {replacement.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Asset</th>
                    <th className="py-2 pr-3 font-medium">Model</th>
                    <th className="py-2 pr-3 font-medium">End of life</th>
                    <th className="py-2 pr-3 font-medium text-right">Current value</th>
                    <th className="py-2 font-medium text-right">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {replacement.map((row) => (
                    <tr key={row.id} className="border-b border-line text-ink">
                      <td className="py-2 pr-3">{row.asset_tag}</td>
                      <td className="py-2 pr-3 text-ink-muted">
                        {`${row.brand ?? ''} ${row.model ?? ''}`.trim() || '—'}
                      </td>
                      <td className="py-2 pr-3 text-ink-muted">{row.end_of_life}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatCurrency(row.current_value)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {row.days_to_end <= 0 ? (
                          <span className="text-status-poor">Overdue</span>
                        ) : (
                          `${row.days_to_end}d`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No assets require replacement yet.</p>
          )}
        </section>
      ) : null}
    </AdminPageShell>
  )
}
