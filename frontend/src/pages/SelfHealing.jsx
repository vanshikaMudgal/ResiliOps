// import { useState } from 'react'
// import { RotateCcw, TrendingUp, Undo2, Container } from 'lucide-react'
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { healingActions, replicaSeries } from '../data/mockData'

// const policies = [
//   { key: 'restart', icon: Container, title: 'Auto container restart', desc: 'Restart a container after 3 failed health checks' },
//   { key: 'pod', icon: RotateCcw, title: 'Kubernetes pod restart', desc: 'Delete unhealthy pod so Kubernetes recreates it' },
//   { key: 'scale', icon: TrendingUp, title: 'Autoscaling', desc: 'Add replicas when CPU stays above 80%' },
//   { key: 'rollback', icon: Undo2, title: 'Auto rollback', desc: 'Revert to previous version if deployment fails' },
// ]

// export default function SelfHealing() {
//   const [enabled, setEnabled] = useState({ restart: true, pod: true, scale: true, rollback: true })

//   return (
//     <>
//       <PageHeader title="Self-Healing" description="Recovery policies and every action taken" />

//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//         {policies.map(({ key, icon: Icon, title, desc }) => (
//           <div key={key} className="rounded-xl border border-slate-800 bg-[#0f1523] p-5">
//             <div className="flex items-center justify-between">
//               <span className="rounded-lg bg-violet-500/10 p-2 text-violet-400"><Icon size={16} /></span>
//               <button
//                 onClick={() => setEnabled({ ...enabled, [key]: !enabled[key] })}
//                 className={`relative h-6 w-11 rounded-full transition ${enabled[key] ? 'bg-blue-600' : 'bg-slate-700'}`}
//               >
//                 <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${enabled[key] ? 'left-[22px]' : 'left-0.5'}`} />
//               </button>
//             </div>
//             <h3 className="mt-4 text-sm font-semibold text-slate-100">{title}</h3>
//             <p className="mt-1 text-xs text-slate-500">{desc}</p>
//           </div>
//         ))}
//       </div>

//       <div className="mt-6 grid gap-6 xl:grid-cols-3">
//         <Card title="Autoscaling: Order API" subtitle="Replica count over time" className="xl:col-span-1">
//           <div className="h-56">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={replicaSeries}>
//                 <CartesianGrid stroke="#1e293b" vertical={false} />
//                 <XAxis dataKey="time" stroke="#475569" fontSize={11} />
//                 <YAxis stroke="#475569" fontSize={11} allowDecimals={false} domain={[0, 6]} />
//                 <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 }} />
//                 <Line type="stepAfter" dataKey="replicas" stroke="#8b5cf6" strokeWidth={2} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>

//         <Card title="Recovery log" className="overflow-x-auto xl:col-span-2">
//           <table className="w-full min-w-[520px] text-left text-sm">
//             <thead className="text-xs text-slate-500"><tr><th className="pb-3">ID</th><th>Action</th><th>Application</th><th>Result</th><th>Time</th></tr></thead>
//             <tbody>
//               {healingActions.map((h) => (
//                 <tr key={h.id} className="border-t border-slate-800">
//                   <td className="py-3 font-mono text-xs text-slate-400">{h.id}</td>
//                   <td className="text-slate-200">{h.action}<p className="text-xs text-slate-500">{h.details}</p></td>
//                   <td className="text-slate-400">{h.app}</td>
//                   <td><StatusBadge status={h.result} /></td>
//                   <td className="text-slate-500">{h.time}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>
//       </div>
//     </>
//   )
// }





import { useState } from 'react'
import { RotateCcw, TrendingUp, Undo2, Container } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const policies = [
  { key: 'restart', icon: Container, title: 'Auto container restart', desc: 'Restart a container after 3 failed health checks' },
  { key: 'pod', icon: RotateCcw, title: 'Kubernetes pod restart', desc: 'Delete unhealthy pod so Kubernetes recreates it' },
  { key: 'scale', icon: TrendingUp, title: 'Autoscaling', desc: 'Add replicas when CPU stays above 80%' },
  { key: 'rollback', icon: Undo2, title: 'Auto rollback', desc: 'Revert to previous version if deployment fails' },
]

export default function SelfHealing() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.get('/api/recovery-actions'), api.get('/api/infrastructure/replica-history')]),
    5000
  )
  // These switches are UI-only for now; Phase 4 will save them and make the engine obey them.
  const [enabled, setEnabled] = useState({ restart: true, pod: true, scale: true, rollback: true })

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [healingActions, replicaSeries] = data

  return (
    <>
      <PageHeader title="Self-Healing" description="Recovery policies and every action taken" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {policies.map(({ key, icon: Icon, title, desc }) => (
          <div key={key} className="rounded-xl border border-slate-800 bg-[#0f1523] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-violet-500/10 p-2 text-violet-400"><Icon size={16} /></span>
              <button
                onClick={() => setEnabled({ ...enabled, [key]: !enabled[key] })}
                className={`relative h-6 w-11 rounded-full transition ${enabled[key] ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${enabled[key] ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-100">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Autoscaling: Order API" subtitle="Replica count over time (sample)" className="xl:col-span-1">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={replicaSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} domain={[0, 6]} />
                <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Line type="stepAfter" dataKey="replicas" stroke="#8b5cf6" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recovery log" className="overflow-x-auto xl:col-span-2">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="pb-3">ID</th><th>Action</th><th>Application</th><th>Result</th><th>Time</th></tr></thead>
            <tbody>
              {healingActions.map((h) => (
                <tr key={h.id} className="border-t border-slate-800">
                  <td className="py-3 font-mono text-xs text-slate-400">{h.id}</td>
                  <td className="text-slate-200">{h.action}<p className="text-xs text-slate-500">{h.details}</p></td>
                  <td className="text-slate-400">{h.app}</td>
                  <td><StatusBadge status={h.result} /></td>
                  <td className="text-slate-500">{h.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  )
}