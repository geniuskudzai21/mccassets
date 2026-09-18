import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.ts'
import { NOTIFICATIONS_CHANGED_EVENT } from '../../lib/notificationsBus.ts'

interface NotificationsResponse {
  unread: number
}

const POLL_INTERVAL_MS = 60_000

export function NotificationsBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true

    async function refresh() {
      try {
        const result = await api<NotificationsResponse>('/api/notifications?limit=1')
        if (active) setUnread(result.unread ?? 0)
      } catch {
        // Silent: the bell must never block navigation on a failed poll.
      }
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
    }
  }, [])

  return (
    <Link
      to="/notifications"
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-status-poor px-1 text-xs font-semibold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  )
}