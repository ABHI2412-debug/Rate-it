const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'ratespace.auth.token'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string>
  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    tokenStorage.clear()
    window.dispatchEvent(new Event('ratespace:unauthorized'))
  }
  if (!response.ok) throw new ApiError(body.message || 'Something went wrong', response.status, body.errors)
  return body as T
}
