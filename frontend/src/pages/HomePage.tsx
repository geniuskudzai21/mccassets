import { Navigate, useNavigate, Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, FileBarChart, ScanLine } from 'lucide-react'
import Button from '../components/ui/Button.tsx'
import TechnicianLayout from '../components/layout/TechnicianLayout.tsx'
import { LogoMark } from '../components/brand/LogoMark.tsx'
import { useAuth } from '../hooks/useAuth.ts'

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Scan & inspect',
    text: 'Identify any asset by QR code and record condition with photos and location in a single flow.',
  },
  {
    icon: ClipboardCheck,
    title: 'Condition tracking',
    text: 'Status ratings update automatically and flag poor assets for maintenance, even offline.',
  },
  {
    icon: FileBarChart,
    title: 'Reports & disposals',
    text: 'Depreciation forecasts, replacement warnings and an audited disposal approval workflow.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()

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

  if (user && (role === 'supervisor' || role === 'admin')) {
    return <Navigate to="/dashboard" replace />
  }

  if (user && role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">
        Loading your workspace…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <LogoMark size={42} />
            <span className="font-serif text-xl font-semibold tracking-tight">MCAS-ICT</span>
          </Link>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6">
        <section className="grid gap-10 py-14 sm:grid-cols-[1.2fr_auto] sm:items-center sm:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-council-teal">
              Mutare City Council · ICT Department
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Know what the council owns — and what it needs.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              MCAS-ICT is the ICT asset register for Mutare City Council: one place to scan,
              inspect, maintain and report on every computer, network device and peripheral.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate('/login')}>
                Sign in to get started <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
              <a
                href="#modules"
                className="rounded-md text-sm font-medium text-ink underline-offset-4 transition-colors hover:text-council-teal hover:underline focus:outline-none focus:ring-2 focus:ring-council-teal"
              >
                Learn about the modules
              </a>
            </div>
          </div>

          <div className="mx-auto">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-line sm:h-48 sm:w-48">
              <LogoMark size={96} ringless />
              <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-council-teal text-xs font-semibold text-white">
                ICT
              </span>
            </div>
          </div>
        </section>

        <section id="modules" className="grid gap-4 pb-16 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-md border border-line bg-white p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-council-teal/10 text-council-teal">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-serif text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-ink-muted">
          <span>© {new Date().getFullYear()} Mutare City Council</span>
          <span>ICT Asset Management System</span>
        </div>
      </footer>
    </div>
  )
}
