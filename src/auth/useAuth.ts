import { createContext, useContext } from 'react'
import type { RegisterRequest, Role, User } from '../api/types'

export interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

/** Página inicial de cada tipo de usuário: vendedor cai no painel, cliente na vitrine. */
export const homeFor = (role: Role) => (role === 'SELLER' ? '/painel' : '/')
