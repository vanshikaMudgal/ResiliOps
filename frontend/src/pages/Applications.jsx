// import { useState } from 'react'
// import { Plus, Play, Pause, X } from 'lucide-react'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { applications as initial, deployments } from '../data/mockData'

// export default function Applications() {
//   const [apps, setApps] = useState(initial)
//   const [selected, setSelected] = useState(initial[0])
//   const [showForm, setShowForm] = useState(false)
//   const [form, setForm] = useState({ name: '', url: '' })

//   const toggleMonitoring = (id) => {
//     setApps(apps.map((a) => (a.id === id ? { ...a, monitoring: !a.monitoring } : a)))
//     setSelected((s) => (s && s.id === id ? { ...s, monitoring: !s.monitoring } : s))
//   }

//   const register = (e) => {
//     e.preventDefault()
//     if (!form.name || !form.url) return
//     const app = { id: Date.now(), name: form.name, url: form.url, status: 'healthy', cpu: 0, memory: 0, uptime: 100, version: 'v1.0.0', replicas: 1, monitoring: true, lastDeploy: 'never', responseMs: 0 }
//     setApps([...apps, app])
//     setForm({ name: '', url: '' })
//     setShowForm(false)
//   }

//   const history = deployments.filter((d) => selected && d.app === selected.name)

//   return (
//     <>
//       <PageHeader
//         title="Applications"
//         description="Register and monitor your applications"
//         action={
//           <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
//             <Plus size={16} /> Register application
//           </button>
//         }
//       />

//       {showForm && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
//           <form onSubmit={register} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f1523] p-6">
//             <div className="mb-4 flex items-center justify-between">
//               <h3 className="font-semibold text-slate-100">Register application</h3>
//               <button type="button" onClick={() => setShowForm(false)} className="text-slate-500"><X size={18} /></button>
//             </div>
//             <label className="text-xs text-slate-400">Name</label>
//             <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mb-3 mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500/50" placeholder="Billing Service" />
//             <label className="text-xs text-slate-400">Health-check URL</label>
//             <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mb-5 mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500/50" placeholder="http://billing:8000/health" />
//             <button className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500">Register</button>
//           </form>
//         </div>
//       )}

//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
//         {apps.map((a) => (
//           <div
//             key={a.id}
//             onClick={() => setSelected(a)}
//             className={`cursor-pointer rounded-xl border bg-[#0f1523] p-5 transition hover:border-slate-600 ${selected?.id === a.id ? 'border-blue-500/60' : 'border-slate-800'}`}
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="font-semibold text-slate-100">{a.name}</h3>
//                 <p className="mt-0.5 truncate text-xs text-slate-500">{a.url}</p>
//               </div>
//               <StatusBadge status={a.status} />
//             </div>
//             <div className="mt-4 grid grid-cols-3 gap-2 text-center">
//               {[['CPU', `${a.cpu}%`], ['Memory', `${a.memory}%`], ['Uptime', `${a.uptime}%`]].map(([k, v]) => (
//                 <div key={k} className="rounded-lg bg-slate-900/60 py-2">
//                   <p className="text-[11px] text-slate-500">{k}</p>
//                   <p className="text-sm font-semibold text-slate-200">{v}</p>
//                 </div>
//               ))}
//             </div>
//             <button
//               onClick={(e) => { e.stopPropagation(); toggleMonitoring(a.id) }}
//               className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium ${a.monitoring ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
//             >
//               {a.monitoring ? <><Pause size={13} /> Monitoring ON · click to stop</> : <><Play size={13} /> Monitoring OFF · click to start</>}
//             </button>
//           </div>
//         ))}
//       </div>

//       {selected && (
//         <Card title={`${selected.name}: details`} subtitle="Selected application" className="mt-6">
//           <div className="grid gap-6 lg:grid-cols-2">
//             <dl className="grid grid-cols-2 gap-4 text-sm">
//               {[['Version', selected.version], ['Replicas', selected.replicas], ['Response time', `${selected.responseMs} ms`], ['Last deploy', selected.lastDeploy], ['Monitoring', selected.monitoring ? 'Enabled' : 'Disabled'], ['Health URL', selected.url]].map(([k, v]) => (
//                 <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 break-all text-slate-200">{v}</dd></div>
//               ))}
//             </dl>
//             <div>
//               <p className="mb-2 text-xs text-slate-500">Deployment history</p>
//               {history.length === 0 && <p className="text-sm text-slate-600">No deployments yet.</p>}
//               {history.map((d) => (
//                 <div key={d.id} className="mb-2 flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm">
//                   <span className="text-slate-300">{d.id} · {d.version}</span>
//                   <StatusBadge status={d.status} />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </Card>
//       )}
//     </>
//   )
// }




import { useState } from 'react'
import { Plus, Play, Pause, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

export default function Applications() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.get('/api/applications'), api.get('/api/deployments')]),
    5000
  )
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '' })
  const [formError, setFormError] = useState('')

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [apps, deployments] = data
  const selected = apps.find((a) => a.id === selectedId) || apps[0]
  const history = selected ? deployments.filter((d) => d.appId === selected.id) : []

  const toggleMonitoring = async (a) => {
    try {
      await api.patch(`/api/applications/${a.id}/monitoring`, { enabled: !a.monitoring })
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const register = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      const created = await api.post('/api/applications', form)
      setSelectedId(created.id)
      setForm({ name: '', url: '' })
      setShowForm(false)
      reload()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Register and monitor your applications"
        action={
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            <Plus size={16} /> Register application
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={register} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f1523] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Register application</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500"><X size={18} /></button>
            </div>
            <label className="text-xs text-slate-400">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mb-3 mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500/50" placeholder="Billing Service" />
            <label className="text-xs text-slate-400">Health-check URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mb-3 mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500/50" placeholder="http://billing:8000/health" />
            {formError && <p className="mb-3 text-xs text-red-400">{formError}</p>}
            <button className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500">Register</button>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={`cursor-pointer rounded-xl border bg-[#0f1523] p-5 transition hover:border-slate-600 ${selected?.id === a.id ? 'border-blue-500/60' : 'border-slate-800'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">{a.name}</h3>
                <p className="mt-0.5 truncate text-xs text-slate-500">{a.url}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[['CPU', `${a.cpu}%`], ['Memory', `${a.memory}%`], ['Uptime', `${a.uptime}%`]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-900/60 py-2">
                  <p className="text-[11px] text-slate-500">{k}</p>
                  <p className="text-sm font-semibold text-slate-200">{v}</p>
                </div>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMonitoring(a) }}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium ${a.monitoring ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
            >
              {a.monitoring ? <><Pause size={13} /> Monitoring ON · click to stop</> : <><Play size={13} /> Monitoring OFF · click to start</>}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <Card title={`${selected.name}: details`} subtitle="Selected application" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[['Version', selected.version], ['Replicas', selected.replicas], ['Response time', `${selected.responseMs} ms`], ['Last deploy', selected.lastDeploy], ['Monitoring', selected.monitoring ? 'Enabled' : 'Disabled'], ['Health URL', selected.url]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 break-all text-slate-200">{v}</dd></div>
              ))}
            </dl>
            <div>
              <p className="mb-2 text-xs text-slate-500">Deployment history</p>
              {history.length === 0 && <p className="text-sm text-slate-600">No deployments yet.</p>}
              {history.map((d) => (
                <div key={d.id} className="mb-2 flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm">
                  <span className="text-slate-300">{d.id} · {d.version}</span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </>
  )
}