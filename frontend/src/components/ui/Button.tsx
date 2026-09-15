import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'solid' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-council-teal focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-council-teal text-white hover:bg-council-teal/90',
  outline: 'border border-council-teal text-council-teal hover:bg-council-teal/5',
  ghost: 'text-council-teal hover:bg-council-teal/5',
}

export default function Button({ variant = 'solid', className, ...props }: ButtonProps) {
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className ?? ''}`} {...props} />
  )
}
