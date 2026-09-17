import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Boxes,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { LogoMark } from '../brand/LogoMark.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import type { UserRole } from '../../types/db.ts'

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

function dashboardPath(role: UserRole | null): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'supervisor') return '/supervisor/dashboard'
  return '/dashboard'
}

function NavLinks({ role, onNavigate }: { role: UserRole | null; onNavigate?: () => void }) {
  const items = NAV.filter((item) => !item.adminOnly || role === 'admin')
  return (
    <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={label === 'Dashboard' ? dashboardPath(role) : to}
          end={label === 'Dashboard'}
          onClick={onNavigate}
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
        </NavLink>
      ))}
    </nav>
  )
}

function UserBlock({
  profileName,
  role,
  onSignOut,
}: {
  profileName: string
  role: UserRole | null
  onSignOut: () => void
}) {
  return (
    <div className="border-t border-line p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-council-teal/10 font-serif text-sm font-semibold text-council-teal">
          {(profileName ?? '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{profileName ?? '—'}</p>
          <p className="truncate text-xs text-ink-muted capitalize">{role ?? '—'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </button>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { role, profile, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSignOut = () => {
    setDrawerOpen(false)
    void signOut()
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-paper text-ink">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-4 py-3 lg:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-council-teal"
        >
          <LogoMark size={32} ringless />
          <span className="font-serif text-lg font-semibold tracking-tight">MCAS-ICT</span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-paper">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                <LogoMark size={32} ringless />
                <span className="font-serif text-lg font-semibold tracking-tight">MCAS-ICT</span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavLinks role={role} onNavigate={() => setDrawerOpen(false)} />
            <UserBlock
              profileName={profile?.full_name ?? '—'}
              role={role}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-paper lg:flex">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-5 py-5 focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <LogoMark size={38} ringless />
            <span className="font-serif text-lg font-semibold tracking-tight">MCAS-ICT</span>
          </Link>
          <NavLinks role={role} />
          <UserBlock
            profileName={profile?.full_name ?? '—'}
            role={role}
            onSignOut={handleSignOut}
          />
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 lg:px-[30px]">{children}</main>
      </div>
    </div>
  )
}
