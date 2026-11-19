// import { useState } from 'react'
// import { Rocket, GitBranch, Check } from 'lucide-react'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { deployments as initial, applications } from '../data/mockData'

// const stages = ['Checkout', 'Test', 'Build image', 'Push', 'Deploy to K8s']

// export default function Deployments() {
//   const [deps, setDeps] = useState(initial)
//   const [selected, setSelected] = useState(initial[0])
//   const [appName, setAppName] = useState(applications[0].name)

//   // Simulated trigger: in Phase 5 this will call GitHub Actions / the backend.
//   const trigger = () => {
//     const id = `DEP-${1043 + deps.length - initial.length + 1}`
//     const dep = {
//       id, app: appName, version: 'v-next', status: 'running', branch: 'main', commit: Math.random().toString(16).slice(2, 9),
//       by: 'you', time: 'just now', duration: '...',
//       logs: ['[ci] Pipeline started', '[ci] Running tests...'],
//     }
//     setDeps((d) => [dep, ...d])
//     setSelected(dep)
//     setTimeout(() => {
//       const done = { ...dep, status: 'success', duration: '1m 12s', logs: [...dep.logs, '[docker] Image built', '[k8s] Rollout complete', '[done] Deployment successful'] }
//       setDeps((d) => d.map((x) => (x.id === id ? done : x)))
//       setSelected((s) => (s.id === id ? done : s))
//     }, 2500)
//   }

//   const count = (s) => deps.filter((d) => d.status === s).length

//   return (
//     <>
//       <PageHeader
//         title="Deployments"
//         description="CI/CD pipeline runs powered by GitHub Actions"
//         action={
//           <div className="flex gap-2">
//             <select value={appName} onChange={(e) => setAppName(e.target.value)} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
//               {applications.map((a) => <option key={a.id}>{a.name}</option>)}
//             </select>
//             <button onClick={trigger} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
//               <Rocket size={16} /> Deploy
//             </button>
//           </div>
//         }
//       />

//       <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//         {[['Total', deps.length, 'text-slate-100'], ['Successful', count('success'), 'text-emerald-400'], ['Failed', count('failed'), 'text-red-400'], ['Rolled back', count('rolled_back'), 'text-violet-400']].map(([k, v, c]) => (
//           <div key={k} className="rounded-xl border border-slate-800 bg-[#0f1523] p-4">
//             <p className="text-xs text-slate-500">{k}</p>
//             <p className={`text-2xl font-semibold ${c}`}>{v}</p>
//           </div>
//         ))}
//       </div>

//       <Card title="Pipeline" subtitle={`Latest run: ${selected.id}`} className="mb-6">
//         <div className="flex flex-wrap items-center gap-2">
//           {stages.map((s, i) => {
//             const failedAt = selected.status === 'failed' && i >= 1
//             return (
//               <div key={s} className="flex items-center gap-2">
//                 <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset ${failedAt ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'}`}>
//                   <Check size={13} /> {s}
//                 </div>
//                 {i < stages.length - 1 && <span className="text-slate-600">→</span>}
//               </div>
//             )
//           })}
//         </div>
//       </Card>

//       <div className="grid gap-6 xl:grid-cols-5">
//         <Card title="Deployment history" className="overflow-x-auto xl:col-span-3">
//           <table className="w-full min-w-[520px] text-left text-sm">
//             <thead className="text-xs text-slate-500">
//               <tr><th className="pb-3">ID</th><th>Application</th><th>Branch</th><th>Status</th><th>Time</th></tr>
//             </thead>
//             <tbody>
//               {deps.map((d) => (
//                 <tr key={d.id} onClick={() => setSelected(d)} className={`cursor-pointer border-t border-slate-800 hover:bg-slate-800/40 ${selected.id === d.id ? 'bg-slate-800/40' : ''}`}>
//                   <td className="py-3 font-mono text-xs text-slate-400">{d.id}</td>
//                   <td className="text-slate-200">{d.app} <span className="text-slate-600">{d.version}</span></td>
//                   <td className="text-slate-400"><span className="inline-flex items-center gap-1"><GitBranch size={12} />{d.branch}</span></td>
//                   <td><StatusBadge status={d.status} /></td>
//                   <td className="text-slate-500">{d.time}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         <Card title={`Logs: ${selected.id}`} subtitle={`${selected.app} · ${selected.duration}`} className="xl:col-span-2">
//           <pre className="max-h-80 overflow-auto rounded-lg bg-black/50 p-4 font-mono text-xs leading-6 text-slate-300">
//             {selected.logs.map((l, i) => (
//               <div key={i} className={l.includes('ERROR') ? 'text-red-400' : l.includes('[done]') ? 'text-emerald-400' : ''}>{l}</div>
//             ))}
//           </pre>
//         </Card>
//       </div>
//     </>
//   )
// }






import { useState } from 'react'
import { Rocket, GitBranch, Check, Loader2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const stages = ['Checkout', 'Test', 'Build image', 'Push', 'Deploy to K8s']

export default function Deployments() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.get('/api/deployments'), api.get('/api/applications')]),
    2000
  )
  const [appId, setAppId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [deps, apps] = data
  const chosenApp = appId ?? apps[0]?.id
  const selected = deps.find((d) => d.id === selectedId) || deps[0] || null
  const count = (s) => deps.filter((d) => d.status === s).length

  const trigger = async () => {
    if (!chosenApp) return
    setBusy(true)
    try {
      const dep = await api.post('/api/deployments', { app_id: Number(chosenApp) })
      setSelectedId(dep.id)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  const stageStyle = (i) => {
    if (selected.status === 'failed' && i >= 1) return 'bg-red-500/10 text-red-400 ring-red-500/20'
    if (selected.status === 'running') return 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
    return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
  }

  return (
    <>
      <PageHeader
        title="Deployments"
        description="CI/CD pipeline runs (simulated until Phase 5 connects GitHub Actions)"
        action={
          <div className="flex gap-2">
            <select value={chosenApp ?? ''} onChange={(e) => setAppId(e.target.value)} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={trigger} disabled={busy} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              <Rocket size={16} /> Deploy
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[['Total', deps.length, 'text-slate-100'], ['Successful', count('success'), 'text-emerald-400'], ['Failed', count('failed'), 'text-red-400'], ['Rolled back', count('rolled_back'), 'text-violet-400']].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-slate-800 bg-[#0f1523] p-4">
            <p className="text-xs text-slate-500">{k}</p>
            <p className={`text-2xl font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {selected && (
        <Card title="Pipeline" subtitle={`Selected run: ${selected.id}`} className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset ${stageStyle(i)}`}>
                  {selected.status === 'running' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {s}
                </div>
                {i < stages.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Deployment history" className="overflow-x-auto xl:col-span-3">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr><th className="pb-3">ID</th><th>Application</th><th>Branch</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {deps.map((d) => (
                <tr key={d.id} onClick={() => setSelectedId(d.id)} className={`cursor-pointer border-t border-slate-800 hover:bg-slate-800/40 ${selected?.id === d.id ? 'bg-slate-800/40' : ''}`}>
                  <td className="py-3 font-mono text-xs text-slate-400">{d.id}</td>
                  <td className="text-slate-200">{d.app} <span className="text-slate-600">{d.version}</span></td>
                  <td className="text-slate-400"><span className="inline-flex items-center gap-1"><GitBranch size={12} />{d.branch}</span></td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="text-slate-500">{d.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {selected && (
          <Card title={`Logs: ${selected.id}`} subtitle={`${selected.app} · ${selected.duration}`} className="xl:col-span-2">
            <pre className="max-h-80 overflow-auto rounded-lg bg-black/50 p-4 font-mono text-xs leading-6 text-slate-300">
              {selected.logs.map((l, i) => (
                <div key={i} className={l.includes('ERROR') ? 'text-red-400' : l.includes('[done]') ? 'text-emerald-400' : l.includes('[simulated]') ? 'text-amber-400' : ''}>{l}</div>
              ))}
            </pre>
          </Card>
        )}
      </div>
    </>
  )
}