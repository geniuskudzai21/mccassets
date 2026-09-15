import { useNavigate, Link } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import Button from '../components/ui/Button.tsx'
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
        ) : (
          <p className="text-sm text-ink-muted">
            Technician workflow (scan, inspections, offline queue) is coming in a later build.
          </p>
        )}
      </main>
    </div>
  )
}
