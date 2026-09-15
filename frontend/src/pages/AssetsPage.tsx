import { Search, Plus, FilterX, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import DataTable, { type Column } from '../components/ui/DataTable.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import Select from '../components/ui/Select.tsx'
import { StatusBadge } from '../components/ui/StatusBadge.tsx'
import { assetStatuses, assetTypes } from '../schemas/asset.schema.ts'
import { useAssets, useDepartments } from '../hooks/useAssets.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { assetTypeLabel, formatCurrency, type AssetFilters, type AssetRow } from '../types/asset.ts'

const PAGE_SIZE = 20

export default function AssetsPage() {
  const { role } = useAuth()
  const { departments } = useDepartments()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [applied, setApplied] = useState<AssetFilters>({})
  const [offset, setOffset] = useState(0)
  const [sortKey, setSortKey] = useState('asset_tag')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const filters = useMemo(() => applied, [applied])
  const { data, loading, error } = useAssets({ filters, limit: PAGE_SIZE, offset })

  const canEdit = role === 'supervisor' || role === 'admin'

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedRows = useMemo(() => {
    const rows = data?.data ?? []
    return [...rows].sort((a, b) => {
      const aValue = a[sortKey as keyof AssetRow]
      const bValue = b[sortKey as keyof AssetRow]
      if (aValue == null || bValue == null) return 0
      const result =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue))
      return sortDirection === 'asc' ? result : -result
    })
  }, [data, sortKey, sortDirection])

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    setOffset(0)
    setApplied({
      q: q.trim() || undefined,
      status: status || undefined,
      type: type || undefined,
      department_id: departmentId || undefined,
    })
  }

  function clearFilters() {
    setQ('')
    setStatus('')
    setType('')
    setDepartmentId('')
    setOffset(0)
    setApplied({})
  }

  const columns: Column<AssetRow>[] = [
    {
      key: 'asset_tag',
      header: 'Asset tag',
      sortable: true,
      render: (asset) => (
        <Link
          to={`/assets/${asset.id}`}
          className="rounded font-medium text-council-teal hover:underline focus:outline-none focus:ring-2 focus:ring-council-teal"
        >
          {asset.asset_tag}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (asset) => assetTypeLabel[asset.type] ?? asset.type,
    },
    {
      key: 'brand',
      header: 'Make / model',
      sortable: true,
      render: (asset) => [asset.brand, asset.model].filter(Boolean).join(' · ') || '—',
    },
    {
      key: 'serial_number',
      header: 'Serial',
      sortable: true,
      render: (asset) => asset.serial_number ?? '—',
    },
    {
      key: 'current_status',
      header: 'Status',
      sortable: true,
      render: (asset) => <StatusBadge status={asset.current_status} />,
    },
    {
      key: 'purchase_cost',
      header: 'Cost',
      sortable: true,
      className: 'text-right',
      render: (asset) => (
        <span className="tabular-nums">{formatCurrency(asset.purchase_cost)}</span>
      ),
    },
  ]

  const departmentOptions = [
    { value: '', label: 'All departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ]
  const statusOptions = [{ value: '', label: 'All statuses' }, ...assetStatuses]
  const typeOptions = [{ value: '', label: 'All types' }, ...assetTypes]

  return (
    <div className="w-full py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">Asset register</h2>
          <p className="mt-1 text-sm text-ink-muted">
            All ICT assets, filterable by department, type and status.
          </p>
        </div>
        {canEdit && (
          <Link
            to="/assets/new"
            className="inline-flex items-center gap-2 rounded-md bg-council-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add asset
          </Link>
        )}
      </div>

      <form
        onSubmit={applyFilters}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper p-4"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="asset-search" className="block text-sm font-medium text-ink">
            Search
          </label>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              id="asset-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tag, brand or serial"
              className="w-full rounded-md border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
            />
          </div>
        </div>
        <div className="w-44">
          <Select
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Type"
            options={typeOptions}
            value={type}
            onChange={(event) => setType(event.target.value)}
          />
        </div>
        <div className="w-56">
          <Select
            label="Department"
            options={departmentOptions}
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          <Button type="button" variant="outline" onClick={clearFilters} aria-label="Clear filters">
            <FilterX className="h-4 w-4" aria-hidden />
            Clear
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-muted">Loading assets…</div>
        ) : error ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="Could not load assets"
            description={error}
          />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="No assets match these filters"
            description="Try widening the search or clearing the filters."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={sortedRows}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
          <span>
            Showing {data.offset + 1}–{Math.min(data.offset + data.data.length, data.total)} of{' '}
            {data.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={data.offset === 0}
              onClick={() => setOffset(Math.max(0, data.offset - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={data.offset + data.data.length >= data.total}
              onClick={() => setOffset(data.offset + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
