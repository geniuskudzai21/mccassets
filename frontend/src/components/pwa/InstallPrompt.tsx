import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LogoMark } from '../brand/LogoMark.tsx'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'mcas:install-prompt-dismissed'
const DISMISS_DAYS = 7
const SHOW_DELAY_MS = 4000

function isStandalone() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

function wasDismissedRecently() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [isIOS] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent))

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return
    if (!/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) return

    let timer: ReturnType<typeof setTimeout> | undefined

    function onBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    }

    function onInstalled() {
      setVisible(false)
      setDeferred(null)
      try {
        window.localStorage.removeItem(DISMISS_KEY)
      } catch {
        /* ignore */
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (isIOS) timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [isIOS])

  function dismiss() {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) {
      dismiss()
      return
    }
    setInstalling(true)
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      else dismiss()
    } catch {
      dismiss()
    } finally {
      setInstalling(false)
      setDeferred(null)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-[1400] mx-auto max-w-sm animate-rise sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-xl shadow-council-teal/20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-council-teal to-council-gold"
        />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="absolute right-2 top-2 rounded-md p-1 text-ink-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-council-teal/10">
            <LogoMark size={34} ringless />
          </span>
          <div className="pr-5">
            <p className="font-serif text-base font-semibold text-ink">Install MCAS-ICT</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {isIOS
                ? 'Tap the Share icon in Safari, then choose "Add to Home Screen".'
                : 'Add the app to your home screen for fast, offline access in the field.'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {isIOS ? (
            <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-council-teal px-3 py-2 text-center text-sm font-medium text-council-teal">
              <Share className="h-4 w-4 shrink-0" aria-hidden />
              Share → Add to Home Screen
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void install()}
              disabled={installing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-council-teal px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              {installing ? 'Opening…' : 'Install app'}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
