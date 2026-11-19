const styles = {
  healthy: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Running: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  created: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  medium: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  investigating: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  planned: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  running: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  low: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  down: 'bg-red-500/10 text-red-400 ring-red-500/20',
  failed: 'bg-red-500/10 text-red-400 ring-red-500/20',
  critical: 'bg-red-500/10 text-red-400 ring-red-500/20',
  open: 'bg-red-500/10 text-red-400 ring-red-500/20',
  CrashLoopBackOff: 'bg-red-500/10 text-red-400 ring-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  rolled_back: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
}

export default function StatusBadge({ status }) {
  const style = styles[status] || 'bg-slate-500/10 text-slate-400 ring-slate-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'running' ? 'animate-pulse' : ''}`} />
      {String(status).replace('_', ' ')}
    </span>
  )
}