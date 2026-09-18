import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastAction {
  label: string
  tone: 'default' | 'primary' | 'danger'
  onClick: () => void
}

interface Toast {
  id: number
  kind: ToastKind
  title: string
  message?: string
  actions?: ToastAction[]
  duration: number
}

export interface ToastOptions {
  kind?: ToastKind
  title: string
  message?: string
  duration?: number
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0
const nextToastId = () => {
  toastId += 1
  return toastId
}

const KIND_STYLES: Record<ToastKind, { bar: string; iconBg: string; icon: string }> = {
  success: {
    bar: 'bg-status-good',
    iconBg: 'bg-status-good/10',
    icon: 'text-status-good',
  },
  error: {
    bar: 'bg-status-poor',
    iconBg: 'bg-status-poor/10',
    icon: 'text-status-poor',
  },
  info: {
    bar: 'bg-gradient-to-r from-council-teal to-council-gold',
    iconBg: 'bg-council-teal/10',
    icon: 'text-council-teal',
  },
}

const ACTION_TONES: Record<ToastAction['tone'], string> = {
  default:
    'rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper focus:outline-none focus:ring-2 focus:ring-council-teal',
  primary:
    'rounded-md bg-council-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal',
  danger:
    'rounded-md bg-status-poor px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-status-poor/90 focus:outline-none focus:ring-2 focus:ring-status-poor',
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') return <CheckCircle2 className="h-5 w-5" style={{ color: '#3F7D4E' }} aria-hidden />
  if (kind === 'error') return <AlertTriangle className="h-5 w-5" style={{ color: '#B0432F' }} aria-hidden />
  return <Info className="h-5 w-5" style={{ color: '#2A5C57' }} aria-hidden />
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const style = KIND_STYLES[toast.kind]
  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto w-full max-w-sm animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-council-teal/15"
    >
      <div aria-hidden className={`h-1 w-full ${style.bar}`} />
      <div className="flex items-start gap-3 p-4">
        <span aria-hidden className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
          <ToastIcon kind={toast.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          {toast.message ? <p className="mt-0.5 text-sm text-ink-muted">{toast.message}</p> : null}
          {toast.actions ? (
            <div className="mt-3 flex justify-end gap-2">
              {toast.actions.map((action) => (
                <button key={action.label} type="button" onClick={action.onClick} className={ACTION_TONES[action.tone]}>
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {!toast.actions ? (
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-ink-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextToastId()
      setToasts((current) => [
        ...current,
        {
          id,
          kind: options.kind ?? 'info',
          title: options.title,
          message: options.message,
          duration: options.duration ?? 4200,
        },
      ])
      window.setTimeout(() => dismiss(id), options.duration ?? 4200)
    },
    [dismiss],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const id = nextToastId()
        const finish = (value: boolean) => {
          setToasts((current) => current.filter((item) => item.id !== id))
          resolve(value)
        }
        setToasts((current) => [
          ...current,
          {
            id,
            kind: 'info',
            title: options.title,
            message: options.message,
            actions: [
              { label: options.cancelLabel ?? 'Cancel', tone: 'default', onClick: () => finish(false) },
              { label: options.confirmLabel ?? 'Delete', tone: options.danger === false ? 'primary' : 'danger', onClick: () => finish(true) },
            ],
            duration: 0,
          },
        ])
        window.setTimeout(() => finish(false), 30000)
      }),
    [],
  )

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-[1500] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((entry) => (
          <ToastCard key={entry.id} toast={entry} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}