import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="center muted">Carregando…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Telas de login/cadastro: ao autenticar, volta para a página que o usuário tentou abrir. */
export function GuestOnly() {
  const { user, loading } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  if (loading) return null
  return user ? <Navigate to={from} replace /> : <Outlet />
}
