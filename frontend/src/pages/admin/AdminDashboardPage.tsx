import { Link } from 'react-router-dom'
import { FileBarChart, Settings2, Trash2 } from 'lucide-react'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'

const TILES = [
  {
    to: '/admin/users',
    icon: Settings2,
    label: 'User management',
    description: 'Invite staff, assign roles, and manage access.',
  },
  {
    to: '/admin/disposals',
    icon: Trash2,
    label: 'Disposals',
    description: 'Review and approve asset disposal requests.',
  },
  {
    to: '/admin/reports',
    icon: FileBarChart,
    label: 'Reports',
    description: 'Register summaries, depreciation and replacement forecasts.',
  },
]

export default function AdminDashboardPage() {
  return (
    <AdminPageShell title="Admin dashboard" description="Overview of administrative functions.">
      <div className="grid gap-4 sm:grid-cols-3">
        {TILES.map(({ to, icon: Icon, label, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col rounded-md border border-line bg-paper p-5 transition-colors hover:bg-council-teal/5 focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-council-teal/10 text-council-teal">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-serif text-lg font-semibold text-ink">{label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  )
}
