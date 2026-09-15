import { Check, Upload } from 'lucide-react'
import { usePendingCount } from '../../hooks/usePendingCount.ts'

export function SyncStatusIndicator() {
  const pending = usePendingCount()

  if (pending === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-xs text-ink-muted"
        title="All inspections synced"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        Synced
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-council-teal/30 bg-council-teal/10 px-2 py-0.5 text-xs font-medium text-council-teal"
      title={`${pending} inspection${pending === 1 ? '' : 's'} waiting to sync`}
    >
      <Upload className="h-3.5 w-3.5 animate-pulse" aria-hidden />
      {pending} pending
    </span>
  )
}
