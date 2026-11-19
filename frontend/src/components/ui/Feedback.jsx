import { Loader2, ServerCrash } from 'lucide-react'

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 size={18} className="animate-spin" /> Loading...
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <ServerCrash className="mx-auto text-red-400" />
      <p className="mt-3 text-sm text-red-300">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-200 hover:bg-slate-700">
        Retry
      </button>
    </div>
  )
}