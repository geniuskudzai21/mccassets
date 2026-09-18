export const NOTIFICATIONS_CHANGED_EVENT = 'mcas:notifications-changed'

/** Broadcasts that unread-count-affecting actions happened (acknowledge, mark read). */
export function notifyNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}