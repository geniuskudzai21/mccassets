interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 40, className = '' }: LogoMarkProps) {
  return (
    <img
      src="/mutarelogo.png"
      alt="Mutare City Council logo"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-contain ring-1 ring-line ${className}`}
    />
  )
}
