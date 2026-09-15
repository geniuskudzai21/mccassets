import type { HTMLAttributes } from 'react'

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-md border border-line bg-paper shadow-sm ${className ?? ''}`}
      {...props}
    />
  )
}
