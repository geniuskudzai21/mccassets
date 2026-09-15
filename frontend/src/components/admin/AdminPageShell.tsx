import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AdminPageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Home
            </Link>
            <h1 className="mt-1 font-serif text-xl font-semibold">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
