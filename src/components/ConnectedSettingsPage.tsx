import { useState } from 'react'
import { Check, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react'
import { ApiError } from '../services/api'
import { userService } from '../services/userService'
import { useAuth } from '../auth/AuthContext'

export default function ConnectedSettingsPage() {
  const { user, logout } = useAuth()
  const [show, setShow] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(''); setError('')
    if (newPassword !== confirmPassword) { setError('New password and confirmation must match'); return }
    try {
      const response = await userService.updatePassword(currentPassword, newPassword)
      setMessage(response.message); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : 'Unable to update password') }
  }

  return <div className="min-h-screen bg-[#09090d] p-5 text-white lg:p-8"><div className="mx-auto max-w-5xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.2em] text-violet-300">Make it yours</p><h1 className="display text-3xl font-medium tracking-[-.05em]">Settings</h1><p className="mt-2 text-sm text-white/40">Manage your account and preferences.</p></div><button onClick={logout} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/55 hover:bg-white/10 hover:text-white">Log out</button></div><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-3xl glass p-6 sm:p-8"><div className="mb-7 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400/12 text-violet-200"><ShieldCheck size={20}/></div><div><h2 className="font-semibold">Change password</h2><p className="text-xs text-white/35">Keep your account secure.</p></div></div><form onSubmit={submit} className="max-w-lg space-y-4">{error && <p className="rounded-2xl border border-rose-300/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}{message && <p className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"><Check size={15} className="mr-2 inline"/>{message}</p>}<PasswordInput label="Current password" value={currentPassword} onChange={setCurrentPassword} show={show}/><PasswordInput label="New password" value={newPassword} onChange={setNewPassword} show={show}/><PasswordInput label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} show={show}/><p className="text-[11px] text-white/30">8–16 characters · one uppercase letter · one special character</p><button type="button" onClick={() => setShow(!show)} className="flex items-center gap-2 text-xs text-white/40 hover:text-white">{show ? <EyeOff size={14}/> : <Eye size={14}/>} {show ? 'Hide' : 'Show'} passwords</button><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">Update password <Check size={15} className="ml-1 inline"/></button></form></section><section className="rounded-3xl glass p-6 sm:p-8"><div className="mb-7 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><UserRound size={20}/></div><div><h2 className="font-semibold">Profile details</h2><p className="text-xs text-white/35">How the community sees you.</p></div></div><div className="space-y-4"><div className="rounded-2xl bg-white/5 p-4"><p className="text-[11px] text-white/30">Display name</p><p className="mt-1 text-sm font-semibold">{user?.name}</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-[11px] text-white/30">Email</p><p className="mt-1 text-sm font-semibold">{user?.email}</p></div><div className="flex items-center gap-3 rounded-2xl bg-emerald-400/8 p-4 text-xs text-emerald-200/80"><Check size={16}/> Your profile is visible to the community.</div></div></section></div></div></div>
}

function PasswordInput({ label, value, onChange, show }: { label: string; value: string; onChange: (value: string) => void; show: boolean }) {
  return <div><label className="mb-2 block text-xs font-medium text-white/60">{label}</label><input required minLength={8} maxLength={16} value={value} onChange={(event) => onChange(event.target.value)} type={show ? 'text' : 'password'} placeholder="••••••••••" className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-violet-300/50"/></div>
}
