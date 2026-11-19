export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-[#0f1523] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}