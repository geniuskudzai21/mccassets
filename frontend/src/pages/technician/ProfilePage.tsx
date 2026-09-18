import { ShieldCheck, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.tsx'
import { useAuth } from '../../hooks/useAuth.ts'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, role, signOut } = useAuth()

  return (
    <div className="px-4 py-5">
      <h2 className="font-serif text-xl font-semibold text-ink">Profile</h2>

      <div className="mt-4 rounded-2xl border border-line bg-paper p-4 shadow-sm">
        <div className="flex items-center gap-2 text-council-teal">
          <ShieldCheck className="h-5 w-5" aria-hidden />
          <span className="capitalize text-ink">{role ?? 'technician'}</span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Name</dt>
            <dd className="mt-0.5 font-medium text-ink">{profile?.full_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="mt-0.5 font-medium text-ink">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Phone</dt>
            <dd className="mt-0.5 font-medium text-ink">{profile?.phone ?? '—'}</dd>
          </div>
        </dl>

        <Button
          variant="outline"
          onClick={() => {
            void signOut()
            navigate('/login')
          }}
          className="mt-6 min-h-12 w-full"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  )
}
