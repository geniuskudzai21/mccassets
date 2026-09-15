interface LogoMarkProps {
  size?: number
  className?: string
  ringless?: boolean
}

export function LogoMark({ size = 40, className = '', ringless = false }: LogoMarkProps) {
  return (
    <img
      src="/mutarelogo.png"
      alt="Mutare City Council logo"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-contain ${ringless ? '' : 'ring-1 ring-line'} ${className}`}
    />
  )
}
