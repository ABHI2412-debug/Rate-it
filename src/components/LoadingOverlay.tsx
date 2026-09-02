import { Sparkles } from 'lucide-react'

export default function LoadingOverlay() {
  return <div className="loading-overlay backdrop-blur-md" role="status" aria-live="polite" aria-label="Loading">
    <div className="flex flex-col items-center justify-center">
      <div className="logo-loader-pulse grid h-16 w-16 place-items-center rounded-2xl bg-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
        <Sparkles size={32} className="text-white" />
      </div>
      <span className="mt-6 text-[13px] font-semibold uppercase tracking-[.15em] text-white/70">Loading</span>
    </div>
  </div>
}
