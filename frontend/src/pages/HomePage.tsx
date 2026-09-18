import { Navigate, useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Coins,
  FileBarChart,
  MapPin,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'
import Button from '../components/ui/Button.tsx'
import TechnicianLayout from '../components/layout/TechnicianLayout.tsx'
import { LogoMark } from '../components/brand/LogoMark.tsx'
import { ScheduleCard } from '../components/schedule/ScheduleCard.tsx'
import { MyMaintenanceList } from '../components/maintenance/MyMaintenanceList.tsx'
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

const PREVIEW_STATS = [
  { icon: Boxes, label: 'Total assets', value: '342', accent: 'text-council-teal' },
  { icon: Coins, label: 'Register value', value: '$2.4M', accent: 'text-status-good' },
]

const PREVIEW_LEGEND = [
  { label: 'Good', color: '#3F7D4E' },
  { label: 'Fair', color: '#B8862E' },
  { label: 'Poor', color: '#B0432F' },
  { label: 'Disposal', color: '#8A8880' },
]

const PREVIEW_BARS = [
  { name: 'Finance', width: '92%' },
  { name: 'ICT', width: '78%' },
  { name: 'Engineering', width: '64%' },
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

          <div className="mt-6">
            <ScheduleCard />
          </div>

          <section className="mt-6 rounded-md border border-line bg-paper p-5">
            <h3 className="font-serif text-base font-semibold text-ink">My maintenance tasks</h3>
            <div className="mt-3">
              <MyMaintenanceList />
            </div>
          </section>
        </div>
      </TechnicianLayout>
    )
  }

  if (user && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user && role === 'supervisor') {
    return <Navigate to="/supervisor/dashboard" replace />
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
      <header className="sticky top-0 z-20 border-b border-council-teal-dark bg-council-teal">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <LogoMark size={42} ringless />
            <span className="font-serif text-xl font-semibold tracking-tight text-white">MCAS-ICT</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-council-teal transition-all hover:bg-white/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-council-teal"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#eaf2ef] via-paper to-paper">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(42 92 87 / 0.07) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-24 h-96 w-96 rounded-full bg-council-teal/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-council-gold/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-council-teal/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-council-teal shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Mutare City Council · ICT Department
                </span>
                <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                  Know what the council owns —{' '}
                  <span className="text-council-teal">and what it needs.</span>
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
                  MCAS-ICT is the ICT asset register for Mutare City Council: one place to scan,
                  inspect, maintain and report on every computer, network device and peripheral.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-council-gold px-6 py-2.5 text-white shadow-lg shadow-council-gold/25 hover:bg-council-gold/90"
                  >
                    Sign in to get started <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                  </Button>
                  <a
                    href="#modules"
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-council-teal underline-offset-4 transition-colors hover:bg-council-teal/5 hover:underline focus:outline-none focus:ring-2 focus:ring-council-teal"
                  >
                    <ScanLine className="h-4 w-4" aria-hidden />
                    Learn about the modules
                  </a>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md">
                <div className="animate-float absolute -left-6 -top-5 z-10 hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-lg sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-council-teal/10 text-council-teal">
                    <ScanLine className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  Scan &amp; inspect
                </div>

                <div className="relative rounded-2xl border border-line bg-white/90 p-5 shadow-2xl shadow-council-teal/10 backdrop-blur">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-status-poor" />
                      <span className="h-2.5 w-2.5 rounded-full bg-status-fair" />
                      <span className="h-2.5 w-2.5 rounded-full bg-status-good" />
                    </div>
                    <span className="font-mono text-[11px] text-ink-muted">mcas-ict · live overview</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-good/10 px-2 py-0.5 text-[10px] font-semibold text-status-good">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-good" aria-hidden />
                      LIVE
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {PREVIEW_STATS.map(({ icon: Icon, label, value, accent }) => (
                      <div key={label} className="rounded-xl border border-line bg-paper p-3">
                        <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
                        <p className="mt-2 font-serif text-xl font-semibold tabular-nums text-ink">{value}</p>
                        <p className="text-[11px] text-ink-muted">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div
                      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background:
                          'conic-gradient(#3F7D4E 0 38%, #B8862E 38% 55%, #B0432F 55% 63%, #8A8880 63% 74%, #E4E2DC 74% 100%)',
                      }}
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white font-serif text-sm font-semibold text-ink">
                        {PREVIEW_LEGEND[0].label}
                      </span>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-1.5">
                      {PREVIEW_LEGEND.map((entry) => (
                        <li key={entry.label} className="flex items-center gap-2 text-xs text-ink-muted">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 space-y-3">
                    {PREVIEW_BARS.map((bar) => (
                      <div key={bar.name}>
                        <div className="flex items-center justify-between text-[11px] text-ink-muted">
                          <span>{bar.name}</span>
                          <span>{bar.width}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-council-teal/70 to-council-teal"
                            style={{ width: bar.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="animate-float-delayed absolute -bottom-5 -right-4 z-10 hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-lg sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-status-good/10 text-status-good">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  GPS tracking
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:border-council-teal/30 hover:shadow-xl hover:shadow-council-teal/10"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-council-teal to-council-gold transition-transform duration-300 group-hover:scale-x-100"
                />
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-council-teal to-council-teal-dark text-white shadow-md shadow-council-teal/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-council-teal/10 bg-council-teal-dark">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-white/70">
          <span>© {new Date().getFullYear()} Mutare City Council</span>
          <span>ICT Asset Management System</span>
        </div>
      </footer>
    </div>
  )
}
