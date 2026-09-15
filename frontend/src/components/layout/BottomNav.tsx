import { ClipboardList, Home, ScanLine, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/my-inspections', label: 'Inspections', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper"
    >
      <div className="mx-auto flex max-w-md">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-council-teal ${
                isActive ? 'text-council-teal' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            <item.icon aria-hidden className="h-6 w-6" strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
