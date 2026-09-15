import { useEffect, useState } from 'react'
import { subscribePendingCount } from '../lib/sync.ts'

export function usePendingCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    return subscribePendingCount(setCount)
  }, [])

  return count
}
