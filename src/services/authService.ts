import { apiRequest } from './api'
import type { User } from '../auth/AuthContext'

export type LoginInput = { email: string; password: string }
export type SignupInput = { name: string; email: string; address: string; password: string }
type AuthResponse = { success: true; token: string; user: User }

export const authService = {
  login: (input: LoginInput) => apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  signup: (input: SignupInput) => apiRequest<{ success: true; message: string; user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
  me: () => apiRequest<{ success: true; user: User }>('/auth/me'),
}
