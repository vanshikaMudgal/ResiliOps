export default function MetricCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
    amber: 'bg-amber-500/10 text-amber-400',
    violet: 'bg-violet-500/10 text-violet-400',
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f1523] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon size={16} /></span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}