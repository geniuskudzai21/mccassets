import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoadingScreen } from '../components/ui/Loading.tsx'
import TechnicianLayout from '../components/layout/TechnicianLayout.tsx'
import WorkspaceShell from '../components/layout/WorkspaceShell.tsx'
import HomePage from '../pages/HomePage.tsx'
import LoginPage from '../pages/LoginPage.tsx'
import NotificationsPage from '../pages/NotificationsPage.tsx'
import AssetsPage from '../pages/AssetsPage.tsx'
import AssetDetailPage from '../pages/AssetDetailPage.tsx'
import AssetFormPage from '../pages/AssetFormPage.tsx'
import InspectionFlowPage from '../pages/technician/InspectionFlowPage.tsx'
import MyInspectionsPage from '../pages/technician/MyInspectionsPage.tsx'
import ProfilePage from '../pages/technician/ProfilePage.tsx'
import SupervisorDashboardPage from '../pages/supervisor/DashboardPage.tsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.tsx'
import UsersPage from '../pages/admin/UsersPage.tsx'
import DisposalsPage from '../pages/admin/DisposalsPage.tsx'
import ReportsPage from '../pages/admin/ReportsPage.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import type { ReactNode } from 'react'
import type { UserRole } from '../types/db.ts'

function RoleDashboardRedirect() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
    <LoadingScreen />
    )
  }

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'supervisor') return <Navigate to="/supervisor/dashboard" replace />
  return <Navigate to="/" replace />
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
    <LoadingScreen />
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
    <LoadingScreen />
    )
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function TechnicianRoute({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireRole roles={['technician']}>
        <TechnicianLayout>{children}</TechnicianLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={<RoleDashboardRedirect />}
      />

      <Route
        path="/admin/dashboard"
        element={
          <WorkspaceShell roles={['admin']}>
            <AdminDashboardPage />
          </WorkspaceShell>
        }
      />

      <Route
        path="/supervisor/dashboard"
        element={
          <WorkspaceShell roles={['supervisor']}>
            <SupervisorDashboardPage />
          </WorkspaceShell>
        }
      />

      <Route
        path="/admin/users"
        element={
          <WorkspaceShell roles={['admin']}>
            <UsersPage />
          </WorkspaceShell>
        }
      />
      <Route
        path="/admin/disposals"
        element={
          <WorkspaceShell roles={['admin']}>
            <DisposalsPage />
          </WorkspaceShell>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <WorkspaceShell roles={['admin']}>
            <ReportsPage />
          </WorkspaceShell>
        }
      />

      <Route
        path="/notifications"
        element={
          <WorkspaceShell roles={['supervisor', 'admin']}>
            <NotificationsPage />
          </WorkspaceShell>
        }
      />

      <Route
        path="/scan"
        element={
          <TechnicianRoute>
            <InspectionFlowPage />
          </TechnicianRoute>
        }
      />
      <Route
        path="/my-inspections"
        element={
          <TechnicianRoute>
            <MyInspectionsPage />
          </TechnicianRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <TechnicianRoute>
            <ProfilePage />
          </TechnicianRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <TechnicianRoute>
            <NotificationsPage />
          </TechnicianRoute>
        }
      />

      <Route
        path="/assets"
        element={
          <WorkspaceShell roles={['supervisor', 'admin']}>
            <AssetsPage />
          </WorkspaceShell>
        }
      />
      <Route
        path="/assets/new"
        element={
          <WorkspaceShell roles={['supervisor', 'admin']}>
            <AssetFormPage />
          </WorkspaceShell>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <WorkspaceShell roles={['supervisor', 'admin']}>
            <AssetDetailPage />
          </WorkspaceShell>
        }
      />
      <Route
        path="/assets/:id/edit"
        element={
          <WorkspaceShell roles={['supervisor', 'admin']}>
            <AssetFormPage />
          </WorkspaceShell>
        }
      />
    </Routes>
  )
}
