import { useCallback, useEffect, useState } from 'react'
import { api, apiPatch, apiPost } from '../lib/api.ts'
import type { NotificationEntry } from '../types/asset.ts'

interface NotificationsResponse {
  data: NotificationEntry[]
  unread: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await api<NotificationsResponse>('/api/notifications')
      setNotifications(result.data)
      setUnread(result.unread)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const result = await api<NotificationsResponse>('/api/notifications')
        if (!active) return
        setNotifications(result.data)
        setUnread(result.unread)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load notifications.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const markRead = useCallback(
    async (id: string) => {
      await apiPatch(`/api/notifications/${id}`, {})
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)),
      )
      setUnread((current) => Math.max(0, current - 1))
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    await apiPost('/api/notifications/read-all', {})
    setNotifications((current) =>
      current.map((item) =>
        item.read_at === null ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    )
    setUnread(0)
  }, [])

  return { notifications, unread, loading, error, refresh, markRead, markAllRead }
}