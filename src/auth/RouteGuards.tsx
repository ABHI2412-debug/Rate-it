import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth, type Role } from './AuthContext'
import { Button } from '../ui/Button'

export function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-[#09090d] text-white"><motion.div animate={{ scale: [1, 1.08, 1], opacity: [.7, 1, .7] }} transition={{ duration: 1.5, repeat: Infinity }} className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/20 text-violet-200"><Sparkles size={25}/></motion.div></div>
}

export function UnauthorizedPage() {
  const { user } = useAuth()
  const dashboard = user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'STORE_OWNER' ? '/owner/dashboard' : '/dashboard'
  return <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#09090d] px-5 text-white"><div className="blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]"/><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-md rounded-[28px] glass p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-400/12 text-rose-200"><ShieldAlert size={28}/></div><p className="mt-6 text-xs font-semibold uppercase tracking-[.22em] text-violet-300">Access boundary</p><h1 className="display mt-3 text-5xl font-medium tracking-[-.06em]">403</h1><h2 className="mt-2 text-lg font-semibold">This space isn’t yours yet.</h2><p className="mt-3 text-sm leading-6 text-white/45">Your account does not have permission to view this area. Return to your role’s dashboard to keep exploring.</p><Button to={dashboard} className="mt-7"><ArrowLeft size={15}/> Back to dashboard</Button></motion.div></div>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

export function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <UnauthorizedPage />
  return <>{children}</>
}
