import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/status.ts'
import type { AssetStatus } from '../../types/db.ts'

export interface StatusBreakdown {
  good: number
  fair: number
  poor: number
  disposal: number
}

const ORDER: AssetStatus[] = ['good', 'fair', 'poor', 'disposal']

export function StatusBreakdownChart({ stats }: { stats: StatusBreakdown }) {
  const data = ORDER.map((key) => ({
    key,
    name: STATUS_LABELS[key],
    value: stats[key] ?? 0,
  }))
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <p className="rounded-md border border-line bg-paper p-6 text-sm text-ink-muted">
        No assets recorded yet.
      </p>
    )
  }

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              stroke="#FAFAF8"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} assets`, name]}
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #E4E2DC',
                background: '#FFFFFF',
                color: '#1C1C1A',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5">
        {data.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 text-sm text-ink">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[entry.key] }}
              aria-hidden
            />
            <span className="flex-1">{entry.name}</span>
            <span className="font-medium tabular-nums text-ink-muted">
              {entry.value} · {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
