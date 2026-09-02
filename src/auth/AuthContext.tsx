import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService, type LoginInput } from '../services/authService'
import { ApiError, tokenStorage } from '../services/api'

export type Role = 'ADMIN' | 'USER' | 'STORE_OWNER'
export type User = { id: string; name: string; email: string; address: string; role: Role }

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStorage.clear()
      setToken(null)
      setUser(null)
    }
    window.addEventListener('ratespace:unauthorized', handleUnauthorized)
    const restore = async () => {
      if (!token) { setIsLoading(false); return }
      try {
        const response = await authService.me()
        setUser({ ...response.user, name: response.user.email === 'user@ratespace.demo' ? "Abhi's Rate Space Community" : response.user.name })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) { tokenStorage.clear(); setToken(null) }
      } finally { setIsLoading(false) }
    }
    void restore()
    return () => window.removeEventListener('ratespace:unauthorized', handleUnauthorized)
  }, [token])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login: async (input) => {
      const response = await authService.login(input)
      tokenStorage.set(response.token)
      setToken(response.token)
      const user = { ...response.user, name: response.user.email === 'user@ratespace.demo' ? "Abhi's Rate Space Community" : response.user.name }
      setUser(user)
      return user
    },
    logout: () => { tokenStorage.clear(); setToken(null); setUser(null) },
  }), [user, token, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
