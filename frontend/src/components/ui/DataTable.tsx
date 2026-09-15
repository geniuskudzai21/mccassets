import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyState?: ReactNode
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return <ArrowUpDown aria-hidden className="h-3.5 w-3.5 text-ink-muted" />
  }
  return direction === 'asc' ? (
    <ArrowUp aria-hidden className="h-3.5 w-3.5 text-council-teal" />
  ) : (
    <ArrowDown aria-hidden className="h-3.5 w-3.5 text-council-teal" />
  )
}

export default function DataTable<T>({
  columns,
  rows,
  sortKey,
  sortDirection = 'asc',
  onSort,
  emptyState,
}: DataTableProps<T>) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-md border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-paper">
          <tr className="border-b border-line">
            {columns.map((column) => {
              const active = sortKey === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-ink ${column.className ?? ''}`}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1 rounded-md font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      {column.header}
                      <SortIcon active={active} direction={sortDirection} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="border-b border-line px-4 py-12 text-center">
                {emptyState ?? 'No rows'}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-b border-line last:border-0 hover:bg-white">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
