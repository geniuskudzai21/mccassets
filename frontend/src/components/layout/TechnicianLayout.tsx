import { useEffect, type ReactNode } from 'react'
import { SYNC_INTERVAL_MS, trySyncOnce } from '../../lib/sync.ts'
import BottomNav from './BottomNav.tsx'
import { SyncStatusIndicator } from './SyncStatusIndicator.tsx'

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
      <div className="mx-auto max-w-md pb-20">
        <header className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
          <p className="font-serif text-lg font-semibold">MCAS-ICT</p>
          <SyncStatusIndicator />
        </header>
        <main>{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
