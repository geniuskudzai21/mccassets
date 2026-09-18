import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileBarChart,
  Lock,
  Mail,
  ScanLine,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { LogoMark } from '../components/brand/LogoMark.tsx'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: ScanLine, text: 'Scan asset QR codes and inspect on the go' },
  { icon: ClipboardCheck, text: 'Track condition and raise maintenance' },
  { icon: FileBarChart, text: 'Depreciation reports and disposal approvals' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-white">
        <div className="grid md:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col justify-between bg-council-teal p-8 text-white">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                  <LogoMark size={40} ringless className="w-10 rounded-full" />
                </span>
                <div>
                  <p className="font-serif text-xl font-semibold tracking-tight">MCAS-ICT</p>
                  <p className="text-sm text-white/70">Mutare City Council</p>
                </div>
              </div>

              <h1 className="mt-8 font-serif text-2xl font-semibold leading-snug text-white">
                One register for every ICT asset the council holds.
              </h1>

              <ul className="mt-7 space-y-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/90">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-8 text-xs text-white/60">
              ICT Asset Management System © {new Date().getFullYear()}
            </p>
          </div>

          <div className="p-8">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Sign in to continue to your workspace.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink">
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="w-full rounded-md border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
                    placeholder="admin@mutare.gov.zw"
                    {...register('email')}
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="mt-1 text-sm text-status-poor">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className="w-full rounded-md border border-line bg-paper py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
                    placeholder="Your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-council-teal rounded-md"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="mt-1 text-sm text-status-poor">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p role="alert" className="text-sm text-status-poor">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-council-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-council-teal/90 focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
