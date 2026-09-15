import { CircleCheck, CircleAlert, CircleX, Circle, type LucideIcon } from 'lucide-react'
import type { AssetStatus } from '../../types/db.ts'

const statusConfig: Record<AssetStatus, { label: string; icon: LucideIcon; color: string }> = {
  good: { label: 'Good', icon: CircleCheck, color: 'text-status-good' },
  fair: { label: 'Fair', icon: CircleAlert, color: 'text-status-fair' },
  poor: { label: 'Poor', icon: CircleX, color: 'text-status-poor' },
  disposal: { label: 'Disposal', icon: Circle, color: 'text-status-disposal' },
}

export function StatusBadge({ status }: { status: AssetStatus }) {
  const { label, icon: Icon, color } = statusConfig[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
      <Icon aria-hidden className={`h-4 w-4 ${color}`} />
      {label}
    </span>
  )
}
