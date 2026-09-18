import { Bell, CheckCheck, Wrench, ShieldAlert, ArrowLeftRight, CalendarClock, AlertTriangle } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.tsx'
import { SkeletonRows } from '../components/ui/Loading.tsx'
import { useNotifications } from '../hooks/useNotifications.ts'
import { formatDate } from '../types/asset.ts'

const TYPE_ICONS: Record<string, typeof Bell> = {
  maintenance_assigned: Wrench,
  fault_reported: ShieldAlert,
  transfer: ArrowLeftRight,
  inspection_due: CalendarClock,
  warranty_expiring: AlertTriangle,
}

export default function NotificationsPage() {
  const { notifications, unread, loading, error, refresh, markRead, markAllRead } =
    useNotifications()

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">Notifications</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </p>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </button>
        ) : null}
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Could not load notifications"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              Retry
            </button>
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="No notifications yet"
          description="Fault reports, assigned tasks and asset alerts will appear here."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {notifications.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Bell
            const isUnread = item.read_at === null
            return (
              <li
                key={item.id}
                className={`flex gap-3 rounded-md border p-4 shadow-sm ${
                  isUnread ? 'border-council-teal/40 bg-council-teal/5' : 'border-line bg-paper'
                }`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-council-teal">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    {isUnread ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-council-teal" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {formatDate(item.created_at)}
                    {item.asset ? ` · ${item.asset.asset_tag}` : ''}
                  </p>
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className="mt-1 text-xs font-medium text-council-teal hover:underline focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      Mark as read
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}