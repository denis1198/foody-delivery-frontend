const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'foody.token'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

let onUnauthorized: (() => void) | null = null

/** Chamado quando uma requisição autenticada recebe 401 (token expirado ou inválido). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers: Record<string, string> = {}
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. A API está rodando?')
  }

  if (response.status === 401 && token) onUnauthorized?.()

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.detail ?? `Erro ${response.status} ao chamar a API.`,
      data?.errors ?? {},
    )
  }
  return data as T
}
