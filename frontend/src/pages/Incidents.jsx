// import { useState } from 'react'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { incidents, healingActions } from '../data/mockData'

// const filters = ['all', 'open', 'investigating', 'resolved']

// export default function Incidents() {
//   const [filter, setFilter] = useState('all')
//   const list = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)

//   return (
//     <>
//       <PageHeader title="Incidents" description="Automatically generated when the detection engine finds a failure" />

//       <div className="mb-4 flex gap-2">
//         {filters.map((f) => (
//           <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}>
//             {f}
//           </button>
//         ))}
//       </div>

//       <Card className="overflow-x-auto !p-0">
//         <table className="w-full min-w-[760px] text-left text-sm">
//           <thead className="text-xs text-slate-500">
//             <tr><th className="px-5 py-3">ID</th><th>Incident</th><th>Severity</th><th>Status</th><th>Detected</th><th>Resolved</th></tr>
//           </thead>
//           <tbody>
//             {list.map((i) => (
//               <tr key={i.id} className="border-t border-slate-800 hover:bg-slate-800/30">
//                 <td className="px-5 py-3 font-mono text-xs text-slate-400">{i.id}</td>
//                 <td>
//                   <p className="text-slate-200">{i.title}</p>
//                   <p className="text-xs text-slate-500">{i.cause}</p>
//                 </td>
//                 <td><StatusBadge status={i.severity} /></td>
//                 <td><StatusBadge status={i.status} /></td>
//                 <td className="text-slate-400">{i.detectedAt}</td>
//                 <td className="text-slate-400">{i.resolvedAt || '—'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </Card>

//       <Card title="Recovery history" subtitle="Actions taken against incidents" className="mt-6">
//         <ul className="space-y-3">
//           {healingActions.map((h) => (
//             <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/50 px-4 py-3 text-sm">
//               <span className="text-slate-300">{h.incident} · {h.action} on {h.app}</span>
//               <span className="flex items-center gap-3 text-xs text-slate-500">{h.time}<StatusBadge status={h.result} /></span>
//             </li>
//           ))}
//         </ul>
//       </Card>
//     </>
//   )
// }









import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const filters = ['all', 'open', 'investigating', 'resolved']

export default function Incidents() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.get('/api/incidents'), api.get('/api/recovery-actions')]),
    5000
  )
  const [filter, setFilter] = useState('all')

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [incidents, healingActions] = data
  const list = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)

  return (
    <>
      <PageHeader title="Incidents" description="Automatically generated when the detection engine finds a failure" />

      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto !p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr><th className="px-5 py-3">ID</th><th>Incident</th><th>Severity</th><th>Status</th><th>Detected</th><th>Resolved</th></tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="px-5 py-3 font-mono text-xs text-slate-400">{i.id}</td>
                <td>
                  <p className="text-slate-200">{i.title}</p>
                  <p className="text-xs text-slate-500">{i.cause}</p>
                </td>
                <td><StatusBadge status={i.severity} /></td>
                <td><StatusBadge status={i.status} /></td>
                <td className="text-slate-400">{i.detectedAt}</td>
                <td className="text-slate-400">{i.resolvedAt || '—'}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-600">No incidents match this filter.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card title="Recovery history" subtitle="Actions taken against incidents" className="mt-6">
        <ul className="space-y-3">
          {healingActions.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/50 px-4 py-3 text-sm">
              <span className="text-slate-300">{h.incident} · {h.action} on {h.app}</span>
              <span className="flex items-center gap-3 text-xs text-slate-500">{h.time}<StatusBadge status={h.result} /></span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}