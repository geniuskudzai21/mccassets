import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Boxes, FileBarChart, LayoutDashboard, LogOut, Settings2, Trash2 } from 'lucide-react'
import { LogoMark } from '../brand/LogoMark.tsx'
import { useAuth } from '../../hooks/useAuth.ts'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly: boolean
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { to: '/assets', label: 'Asset register', icon: Boxes, adminOnly: false },
  { to: '/admin/users', label: 'User management', icon: Settings2, adminOnly: true },
  { to: '/admin/disposals', label: 'Disposals', icon: Trash2, adminOnly: true },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart, adminOnly: true },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const { role, profile, signOut } = useAuth()
  const items = NAV.filter((item) => !item.adminOnly || role === 'admin')

  return (
    <div className="flex min-h-screen w-full bg-paper text-ink">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-paper">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-5 py-5 focus:outline-none focus:ring-2 focus:ring-council-teal"
        >
          <LogoMark size={38} ringless />
          <span className="font-serif text-lg font-semibold tracking-tight">MCAS-ICT</span>
        </Link>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {items.map(({ to, label, icon: Icon, adminOnly }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-council-teal ${
                  isActive
                    ? 'bg-council-teal/10 text-council-teal'
                    : 'text-ink hover:bg-council-teal/5 hover:text-ink'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
              {adminOnly ? (
                <span className="ml-auto rounded-full border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
                  Admin
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-council-teal/10 font-serif text-sm font-semibold text-council-teal">
              {(profile?.full_name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{profile?.full_name ?? '—'}</p>
              <p className="truncate text-xs text-ink-muted capitalize">{role ?? '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-[30px] py-6">{children}</main>
    </div>
  )
}
