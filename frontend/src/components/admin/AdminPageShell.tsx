import type { ReactNode } from 'react'

interface AdminPageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="w-full">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-paper to-[#e8f0ee] px-5 py-7 sm:px-7 sm:py-8">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-council-teal via-council-teal/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-council-teal/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-status-fair/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="pt-6">{children}</div>
    </div>
  )
}