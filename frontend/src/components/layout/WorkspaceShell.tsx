import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import { LoadingScreen } from '../ui/Loading.tsx'
import type { UserRole } from '../../types/db.ts'
import AppShell from './AppShell.tsx'

interface WorkspaceShellProps {
  roles: UserRole[]
  children: ReactNode
}

export default function WorkspaceShell({ roles, children }: WorkspaceShellProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <AppShell>{children}</AppShell>
}
