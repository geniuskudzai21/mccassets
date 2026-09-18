import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SYNC_INTERVAL_MS, trySyncOnce } from '../../lib/sync.ts'
import BottomNav from './BottomNav.tsx'
import { SyncStatusIndicator } from './SyncStatusIndicator.tsx'
import { LogoMark } from '../brand/LogoMark.tsx'
import { NotificationsBell } from '../notifications/NotificationsBell.tsx'

export default function TechnicianLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    function handleOnline() {
      void trySyncOnce()
    }

    const interval = window.setInterval(() => {
      void trySyncOnce()
    }, SYNC_INTERVAL_MS)

    void trySyncOnce()
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-md pb-28">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper px-4 py-3 shadow-[0_8px_16px_-8px_rgba(31,71,66,0.35)]">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <LogoMark size={30} ringless />
            <span className="font-serif text-lg font-semibold tracking-tight text-council-teal-dark">
              MCAS-ICT
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <SyncStatusIndicator />
          </div>
        </header>
        <main>{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
