import type { ReactNode } from 'react'
import BottomNav from './BottomNav.tsx'

export default function TechnicianLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-md pb-20">
        <header className="border-b border-line bg-paper px-4 py-3">
          <p className="font-serif text-lg font-semibold">MCAS-ICT</p>
        </header>
        <main>{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
