import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStorage } from '../api/client'
import type { AuthResponse, User } from '../api/types'
import { AuthContext, type AuthState } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStorage.get() !== null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (tokenStorage.get()) {
      authApi
        .me()
        .then(setUser)
        .catch(logout)
        .finally(() => setLoading(false))
    }
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const value = useMemo<AuthState>(() => {
    const start = ({ token, user }: AuthResponse) => {
      tokenStorage.set(token)
      setUser(user)
    }
    return {
      user,
      loading,
      logout,
      login: async (email, password) => start(await authApi.login(email, password)),
      register: async (name, email, password) => start(await authApi.register(name, email, password)),
    }
  }, [user, loading, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
