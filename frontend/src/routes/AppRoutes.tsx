import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from '../pages/HomePage.tsx'
import LoginPage from '../pages/LoginPage.tsx'
import AssetsPage from '../pages/AssetsPage.tsx'
import AssetDetailPage from '../pages/AssetDetailPage.tsx'
import AssetFormPage from '../pages/AssetFormPage.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import type { ReactNode } from 'react'
import type { UserRole } from '../types/db.ts'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/assets"
        element={
          <RequireAuth>
            <RequireRole roles={['supervisor', 'admin']}>
              <AssetsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/assets/new"
        element={
          <RequireAuth>
            <RequireRole roles={['supervisor', 'admin']}>
              <AssetFormPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <RequireAuth>
            <RequireRole roles={['supervisor', 'admin']}>
              <AssetDetailPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/assets/:id/edit"
        element={
          <RequireAuth>
            <RequireRole roles={['supervisor', 'admin']}>
              <AssetFormPage />
            </RequireRole>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
