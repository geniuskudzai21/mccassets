import { useNavigate } from 'react-router-dom'
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

      <main className="px-6 py-8">
        <p className="text-sm text-ink-muted">
          Placeholder homepage — scaffold ready for role-based pages.
        </p>
      </main>
    </div>
  )
}
