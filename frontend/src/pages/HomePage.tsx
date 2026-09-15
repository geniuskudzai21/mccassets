import { useNavigate, Link } from 'react-router-dom'
import { Boxes, LayoutDashboard, ScanLine, Settings2, Trash2, FileBarChart } from 'lucide-react'
import Button from '../components/ui/Button.tsx'
import TechnicianLayout from '../components/layout/TechnicianLayout.tsx'
import { useAuth } from '../hooks/useAuth.ts'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, profile, role, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">
        Loading…
      </div>
    )
  }

  if (user && role === 'technician') {
    return (
      <TechnicianLayout>
        <div className="px-4 py-5">
          <h2 className="font-serif text-xl font-semibold text-ink">Ready to inspect?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Scan an asset QR code to record its condition, photos and GPS location.
          </p>
          <Link
            to="/scan"
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-council-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1"
          >
            <ScanLine className="h-5 w-5" aria-hidden />
            Start inspection
          </Link>
        </div>
      </TechnicianLayout>
    )
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
        <h1 className="font-serif text-xl font-semibold">MCAS-ICT</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted">{profile?.full_name ?? user.email}</span>
            <span className="rounded-md border border-line px-2 py-1 text-sm text-ink">
              {role ?? '—'}
            </span>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {role === 'supervisor' || role === 'admin' ? (
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-ink">Workspace</h2>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <LayoutDashboard className="h-5 w-5 text-council-teal" aria-hidden />
              <div>
                <p className="font-medium text-ink">Supervisor dashboard</p>
                <p className="text-sm text-ink-muted">
                  Status breakdown chart, live asset map and maintenance requests.
                </p>
              </div>
            </Link>
            <Link
              to="/assets"
              className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <Boxes className="h-5 w-5 text-council-teal" aria-hidden />
              <div>
                <p className="font-medium text-ink">Asset register</p>
                <p className="text-sm text-ink-muted">
                  Search, filter and manage the full asset list.
                </p>
              </div>
            </Link>
            <p className="pt-4 text-sm text-ink-muted">
              More modules (inspections, maintenance, reports) land in upcoming builds.
            </p>
          </div>
        ) : null}

        {role === 'admin' ? (
          <div className="mt-6 space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-ink">Administration</h2>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <Settings2 className="h-5 w-5 text-council-teal" aria-hidden />
              <div>
                <p className="font-medium text-ink">User management</p>
                <p className="text-sm text-ink-muted">
                  Invite staff, set roles and departments, control access.
                </p>
              </div>
            </Link>
            <Link
              to="/admin/disposals"
              className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <Trash2 className="h-5 w-5 text-council-teal" aria-hidden />
              <div>
                <p className="font-medium text-ink">Disposals workflow</p>
                <p className="text-sm text-ink-muted">
                  Record asset disposals and manage approval.
                </p>
              </div>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <FileBarChart className="h-5 w-5 text-council-teal" aria-hidden />
              <div>
                <p className="font-medium text-ink">Reports</p>
                <p className="text-sm text-ink-muted">
                  Summaries, depreciation table and replacement forecasting, exportable to PDF.
                </p>
              </div>
            </Link>
          </div>
        ) : null}

        {role === 'technician' || role === null || role === undefined ? (
          <p className="text-sm text-ink-muted">
            Technician workflow (scan, inspections, offline queue) is coming in a later build.
          </p>
        ) : null}
      </main>
    </div>
  )
}
