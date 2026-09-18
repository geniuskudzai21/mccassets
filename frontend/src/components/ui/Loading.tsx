import { LogoMark } from '../brand/LogoMark.tsx'

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper text-ink-muted">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-council-teal/15"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-council-teal/20 border-t-council-teal"
        />
        <LogoMark size={34} ringless />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`skeleton-shimmer block rounded-md ${className}`} />
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="rounded-xl border border-line bg-white p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-40" />
        </li>
      ))}
    </ul>
  )
}
