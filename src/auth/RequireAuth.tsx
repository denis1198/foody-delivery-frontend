import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '../api/types'
import { homeFor, useAuth } from './useAuth'

function Loading() {
  return <p className="py-24 text-center text-sm text-ink-muted">Carregando…</p>
}

/** Exige login e o papel indicado; quem tem outro papel volta para a própria área. */
export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

/**
 * Telas de login/cadastro. Ao autenticar, volta para a página que o usuário tentou abrir
 * (se for da área dele) ou para a página inicial do seu papel.
 */
export function GuestOnly() {
  const { user, loading } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from
  if (loading) return null
  if (!user) return <Outlet />

  const home = homeFor(user.role)
  const fromIsOwnArea = from && (user.role === 'SELLER') === from.startsWith('/painel')
  return <Navigate to={fromIsOwnArea ? from : home} replace />
}
