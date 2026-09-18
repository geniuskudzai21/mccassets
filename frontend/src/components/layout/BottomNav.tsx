import { Bell, ClipboardList, Home, ScanLine, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true, primary: false },
  { to: '/my-inspections', label: 'Inspections', icon: ClipboardList, end: false, primary: false },
  { to: '/scan', label: 'Scan', icon: ScanLine, end: false, primary: true },
  { to: '/notifications', label: 'Alerts', icon: Bell, end: false, primary: false },
  { to: '/profile', label: 'Profile', icon: User, end: false, primary: false },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 shadow-[0_-6px_16px_-8px_rgba(31,71,66,0.35)] backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-end">
        {items.map((item) => {
          if (item.primary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-1 flex-col items-center gap-1 pb-1.5 text-[11px] font-medium text-ink-muted focus:outline-none"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`-mt-6 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-council-teal/30 ring-4 ring-paper transition-colors ${
                        isActive ? 'bg-council-teal-dark' : 'bg-council-teal'
                      }`}
                    >
                      <item.icon aria-hidden className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className={isActive ? 'text-council-teal' : undefined}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-council-teal ${
                  isActive ? 'text-council-teal' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              <item.icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}