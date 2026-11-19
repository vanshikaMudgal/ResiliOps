import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Boxes, Rocket, LineChart, AlertTriangle, HeartPulse, Cloud, Settings, ShieldCheck, X } from 'lucide-react'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/applications', label: 'Applications', icon: Boxes },
  { to: '/deployments', label: 'Deployments', icon: Rocket },
  { to: '/monitoring', label: 'Monitoring', icon: LineChart },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/self-healing', label: 'Self-Healing', icon: HeartPulse },
  { to: '/infrastructure', label: 'Infrastructure', icon: Cloud },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-[#0c111d] transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 p-1.5"><ShieldCheck size={18} className="text-white" /></span>
            <span className="text-lg font-semibold tracking-tight text-white">ResiliOps</span>
          </div>
          <button onClick={onClose} className="text-slate-400 lg:hidden"><X size={18} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-5 text-xs text-slate-600">v0.1 · College Prototype</div>
      </aside>
    </>
  )
}