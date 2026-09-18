import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarClock, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiGet } from '../../lib/api.ts'
import type {
  DueInspectionItem,
  DueSchedulesResponse,
  ScheduleReplacementItem,
  WarrantyExpiringItem,
} from '../../types/asset.ts'

const POLL_INTERVAL_MS = 60 * 1000

function polishStatusStyle(color: string) {
  return {
    color,
    borderColor: `${color}40`,
    backgroundColor: `${color}14`,
  }
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="font-serif text-base font-semibold text-ink">{children}</h3>
}

function SectionEmpty() {
  return <p className="text-sm text-ink-muted">Nothing due.</p>
}

function DueRow({ item, tag }: { item: DueInspectionItem | WarrantyExpiringItem; tag: string }) {
  const overdue = 'days_overdue' in item && item.days_overdue > 0
  const daysText =
    'days_overdue' in item
      ? overdue
        ? `${item.days_overdue} day(s) overdue`
        : 'Due now'
      : `${item.days_to_expiry} day(s) left`

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-b-0">
      <Link
        to={`/assets/${item.id}`}
        className="min-w-0 text-sm font-medium text-ink hover:text-council-teal focus:outline-none focus:ring-2 focus:ring-council-teal"
      >
        {item.asset_tag}
        <span className="ml-2 text-xs font-normal text-ink-muted">{item.type}</span>
      </Link>
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
        style={polishStatusStyle(tag === 'overdue' ? '#A93226' : tag === 'warranty' ? '#B9770E' : '#6B6B65')}
      >
        {daysText}
      </span>
    </li>
  )
}

export function ScheduleCard({ showReplacement = false }: { showReplacement?: boolean }) {
  const [schedule, setSchedule] = useState<DueSchedulesResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const result = await apiGet<DueSchedulesResponse>('/api/schedules/due')
        if (active) setSchedule(result.data)
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the schedule.')
      }
    }
    void load()
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const dueCount = schedule
    ? schedule.due_inspections.length + schedule.warranty_expiring.length
    : 0

  const loading = schedule === null && error === null

  return (
    <section className="rounded-md border border-line bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeader>Schedule</SectionHeader>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <RefreshCw className="h-3 w-3" aria-hidden />
          Refreshes every minute
        </span>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-status-poor">
          {error}
        </p>
      ) : loading ? (
        <p className="mt-3 text-sm text-ink-muted">Loading schedule…</p>
      ) : !schedule || dueCount === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          No inspections or warranties are due in the next 90 days.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-status-poor">
                <CalendarClock className="h-4 w-4" aria-hidden />
                Inspections due ({schedule.due_inspections.length})
              </p>
              {schedule.due_inspections.length === 0 ? (
                <SectionEmpty />
              ) : (
                <ul className="mt-1">
                  {schedule.due_inspections.map((item) => (
                    <DueRow key={item.id} item={item} tag="overdue" />
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-status-fair">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Warranties expiring ({schedule.warranty_expiring.length})
              </p>
              {schedule.warranty_expiring.length === 0 ? (
                <SectionEmpty />
              ) : (
                <ul className="mt-1">
                  {schedule.warranty_expiring.map((item) => (
                    <DueRow key={item.id} item={item} tag="warranty" />
                  ))}
                </ul>
              )}
            </div>

            {showReplacement && (
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-status-poor">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  Replacement due ({schedule.replacement_due.length})
                </p>
                {schedule.replacement_due.length === 0 ? (
                  <SectionEmpty />
                ) : (
                  <ul className="mt-1">
                    {schedule.replacement_due.map((item: ScheduleReplacementItem) => (
                      <ReplacementRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function ReplacementRow({ item }: { item: ScheduleReplacementItem }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-b-0">
      <Link
        to={`/assets/${item.id}`}
        className="min-w-0 text-sm font-medium text-ink hover:text-council-teal focus:outline-none focus:ring-2 focus:ring-council-teal"
      >
        {item.asset_tag}
        <span className="ml-2 text-xs font-normal text-ink-muted">{item.type}</span>
      </Link>
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
        style={polishStatusStyle('#A93226')}
      >
        {item.days_to_end < 0
          ? `${Math.abs(item.days_to_end)} day(s) past end of life`
          : `Ends in ${item.days_to_end} day(s)`}
      </span>
    </li>
  )
}