import {
  ArrowRight,
  Box,
  Boxes,
  Building2,
  ClipboardCheck,
  Coins,
  FileBarChart,
  MapPin,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminPageShell } from '../../components/admin/AdminPageShell.tsx'
import { apiGet } from '../../lib/api.ts'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/status.ts'
import { assetTypes } from '../../schemas/asset.schema.ts'
import type { AssetStatus } from '../../types/db.ts'
import type { AdminOverview } from '../../types/asset.ts'

const STATUS_ORDER: AssetStatus[] = ['good', 'fair', 'poor', 'disposal']

const TYPE_LABELS = new Map(assetTypes.map((option) => [option.value, option.label]))

const GLOBALS = { animationDuration: 600 }

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #E4E2DC',
  background: '#FFFFFF',
  color: '#1C1C1A',
  fontSize: 13,
  boxShadow: '0 8px 24px rgb(28 28 26 / 0.08)',
}

function formatUpdated(iso: string): string {
  const date = new Date(iso)
  return `Updated ${date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: typeof Box
  label: string
  value: string
  accent: 'teal' | 'good' | 'fair' | 'poor'
  hint?: string
}) {
  const accentClasses = {
    teal: 'bg-council-teal/10 text-council-teal',
    good: 'bg-status-good/10 text-status-good',
    fair: 'bg-status-fair/10 text-status-fair',
    poor: 'bg-status-poor/10 text-status-poor',
  }[accent]
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-paper p-5 shadow-sm transition-shadow hover:shadow-md">
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-council-teal transition-transform duration-300 group-hover:scale-x-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
        </div>
        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  )
}

function StatusDonut({ byStatus, total }: { byStatus: Record<AssetStatus, number>; total: number }) {
  const data = STATUS_ORDER.map((key) => ({
    key,
    name: STATUS_LABELS[key],
    value: byStatus[key] ?? 0,
  }))
  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={86}
            paddingAngle={2}
            stroke="#FAFAF8"
            strokeWidth={2}
            animationDuration={GLOBALS.animationDuration}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} assets`, name]}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-serif text-3xl font-semibold tabular-nums text-ink">{total}</p>
        <p className="text-xs text-ink-muted">assets</p>
      </div>
    </div>
  )
}

function TypeBars({ rows }: { rows: { type: string; count: number }[] }) {
  const data = rows.map((row) => ({
    name: TYPE_LABELS.get(row.type) ?? row.type,
    count: row.count,
  }))
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={86}
            tick={{ fill: '#6B6B65', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgb(28 28 26 / 0.04)' }}
            formatter={(value) => [`${value} assets`, 'Count']}
            contentStyle={tooltipStyle}
          />
          <Bar
            dataKey="count"
            fill="#2A5C57"
            radius={[0, 6, 6, 0]}
            barSize={16}
            animationDuration={GLOBALS.animationDuration}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DepartmentBars({ rows }: { rows: { name: string; count: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">No assets assigned to departments yet.</p>
  }
  const max = Math.max(...rows.map((row) => row.count))
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate pr-3 text-ink">{row.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-ink-muted">{row.count}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-council-teal/70 to-council-teal"
              style={{ width: `${Math.max(4, Math.round((row.count / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Section({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-line bg-paper p-5 shadow-sm ${className}`}
    >
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="mb-3 mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}

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
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await apiGet<{ data: AdminOverview }>('/api/admin/overview')
        if (active) {
          setOverview(result.data)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the dashboard.')
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 60 * 1000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const loading = overview === null && error === null

  return (
    <AdminPageShell
      title="Admin dashboard"
      description="Live overview of the ICT asset register."
      actions={
        overview ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-muted">
            <RefreshCw className="h-3.5 w-3.5 text-council-teal" aria-hidden />
            {formatUpdated(overview.as_of)}
          </span>
        ) : undefined
      }
    >
      {error ? (
        <p role="alert" className="mb-4 text-sm text-status-poor">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl border border-line bg-paper" />
          ))}
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Boxes}
              label="Total assets"
              value={overview.assets.total.toLocaleString()}
              accent="teal"
              hint={`${overview.assets.located.toLocaleString()} located by GPS`}
            />
            <StatCard
              icon={Coins}
              label="Register value (current)"
              value={`$${Math.round(overview.assets.total_value).toLocaleString()}`}
              accent="good"
              hint="Depreciated book value"
            />
            <StatCard
              icon={ShieldAlert}
              label="Faulty assets"
              value={overview.assets.faulty.toLocaleString()}
              accent="poor"
              hint={`${overview.assets.functional.toLocaleString()} functioning`}
            />
            <StatCard
              icon={Wrench}
              label="Open maintenance"
              value={overview.maintenance.open.toLocaleString()}
              accent="fair"
              hint={`${overview.maintenance.assigned_technicians} technician(s) assigned`}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Section title="Asset condition" subtitle="Register by current status.">
              <StatusDonut byStatus={overview.assets.by_status} total={overview.assets.total} />
            </Section>

            <Section title="Assets by type" subtitle="Most common asset categories.">
              <TypeBars rows={overview.assets.by_type} />
            </Section>

            <Section title="Department distribution" subtitle="Where the register sits.">
              <DepartmentBars rows={overview.assets.by_department} />
            </Section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="Needs attention" subtitle="Actions worth prioritising right now.">
              <div className="grid gap-3 sm:grid-cols-2">
                <AttentionCard
                  icon={RefreshCw}
                  label="Replacement due"
                  value={overview.alerts.replacement_due}
                  tone="poor"
                  to="/admin/reports"
                />
                <AttentionCard
                  icon={ShieldAlert}
                  label="Warranty expiring soon"
                  value={overview.alerts.warranty_expiring_90d}
                  tone="fair"
                  to="/admin/reports"
                />
                <AttentionCard
                  icon={MapPin}
                  label="Assets not GPS-located"
                  value={overview.alerts.unlocated_assets}
                  tone="fair"
                  to="/assets"
                />
                <AttentionCard
                  icon={Wrench}
                  label="Pending requests"
                  value={overview.maintenance.pending}
                  tone="teal"
                  to="/admin/reports"
                />
              </div>
            </Section>

            <Section title="System activity" subtitle="How the system is being used.">
              <div className="grid grid-cols-2 gap-4">
                <ActivityStat icon={ClipboardCheck} label="Inspections (30d)" value={overview.inspections.last_30d} />
                <ActivityStat icon={ClipboardCheck} label="Inspections (7d)" value={overview.inspections.last_7d} />
                <ActivityStat icon={Wrench} label="Repairs completed (30d)" value={overview.maintenance.completed_30d} />
                <ActivityStat icon={Building2} label="Active staff" value={overview.people.total} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                <span className="text-ink-muted">Current staff by role</span>
                <span className="flex items-center gap-3 font-medium tabular-nums text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-council-teal" aria-hidden />
                    {overview.people.technicians} technicians
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-status-fair" aria-hidden />
                    {overview.people.supervisors} supervisors
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-status-disposal" aria-hidden />
                    {overview.people.admins} admins
                  </span>
                </span>
              </div>
            </Section>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Administration</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {TILES.map(({ to, icon: Icon, label, description }) => (
                <Link
                  key={to}
                  to={to}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-paper p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-council-teal"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 scale-x-0 bg-council-teal transition-transform duration-300 group-hover:scale-x-100"
                  />
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-council-teal/10 text-council-teal">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-council-teal"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-ink">{label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </AdminPageShell>
  )
}

function AttentionCard({
  icon: Icon,
  label,
  value,
  tone,
  to,
}: {
  icon: typeof Wrench
  label: string
  value: number
  tone: 'teal' | 'good' | 'fair' | 'poor'
  to: string
}) {
  const dot = {
    teal: 'bg-council-teal',
    good: 'bg-status-good',
    fair: 'bg-status-fair',
    poor: 'bg-status-poor',
  }[tone]
  const text = {
    teal: 'text-council-teal',
    good: 'text-status-good',
    fair: 'text-status-fair',
    poor: 'text-status-poor',
  }[tone]
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-line bg-paper p-3 transition-colors hover:bg-council-teal/5 focus:outline-none focus:ring-2 focus:ring-council-teal"
    >
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-line/60 ${text}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{label}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {value.toLocaleString()}
      </span>
    </Link>
  )
}

function ActivityStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardCheck
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-council-teal/10 text-council-teal">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink">{value.toLocaleString()}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  )
}