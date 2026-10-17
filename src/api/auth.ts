import { api } from './client'
import type { AuthResponse, User } from './types'

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api<AuthResponse>('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => api<User>('/api/auth/me'),
}
