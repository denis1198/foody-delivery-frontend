import { api } from './client'
import type { AuthResponse, RegisterRequest, User } from './types'

export const authApi = {
  register: (request: RegisterRequest) => api<AuthResponse>('/api/auth/register', { method: 'POST', body: request }),
  login: (email: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => api<User>('/api/auth/me'),
}
