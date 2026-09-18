import type { ReactNode } from 'react'

interface AdminPageShellProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, description, actions, children }: AdminPageShellProps) {
  const hasHeading = Boolean(title || description)
  const hasHeader = hasHeading || Boolean(actions)
  return (
    <div className="w-full">
      {hasHeader ? (
        <header
          className={`flex flex-wrap items-center gap-3 border-b border-line pb-4 ${
            hasHeading ? 'justify-between' : 'justify-end'
          }`}
        >
          {hasHeading ? (
            <div>
              {title ? <h1 className="font-serif text-xl font-semibold text-ink">{title}</h1> : null}
              {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
            </div>
          ) : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="pt-5">{children}</div>
    </div>
  )
}