import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="center muted">Carregando…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestOnly() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : <Outlet />
}
