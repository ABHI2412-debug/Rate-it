import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function Button({ children, variant = 'primary', className = '', onClick, to }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; className?: string; onClick?: () => void; to?: string }) {
  const styles = variant === 'primary' ? 'bg-white text-slate-950 hover:bg-violet-100 shadow-xl shadow-violet-500/10' : variant === 'secondary' ? 'glass-soft text-white hover:bg-white/12' : 'text-white/60 hover:bg-white/8 hover:text-white'
  const content = <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles} ${className}`}>{children}</motion.span>
  return to ? <Link to={to}>{content}</Link> : <button onClick={onClick}>{content}</button>
}
