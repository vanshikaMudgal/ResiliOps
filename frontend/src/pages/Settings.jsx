// import { useState } from 'react'
// import { Save } from 'lucide-react'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'

// const fields = [
//   { key: 'cpu', label: 'CPU threshold', unit: '%', min: 50, max: 100 },
//   { key: 'memory', label: 'Memory threshold', unit: '%', min: 50, max: 100 },
//   { key: 'failures', label: 'Consecutive failed health checks', unit: '', min: 1, max: 10 },
//   { key: 'interval', label: 'Health-check interval', unit: 's', min: 5, max: 120 },
// ]

// export default function Settings() {
//   const [values, setValues] = useState({ cpu: 80, memory: 85, failures: 3, interval: 30 })
//   const [saved, setSaved] = useState(false)

//   const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

//   return (
//     <>
//       <PageHeader title="Settings" description="Failure-detection thresholds (saved to the backend in Phase 2)" />
//       <Card title="Detection thresholds" className="max-w-2xl">
//         <div className="space-y-6">
//           {fields.map((f) => (
//             <div key={f.key}>
//               <div className="mb-2 flex justify-between text-sm">
//                 <label className="text-slate-300">{f.label}</label>
//                 <span className="font-semibold text-blue-400">{values[f.key]}{f.unit}</span>
//               </div>
//               <input type="range" min={f.min} max={f.max} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: Number(e.target.value) })} className="w-full accent-blue-500" />
//             </div>
//           ))}
//         </div>
//         <button onClick={save} className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
//           <Save size={15} /> {saved ? 'Saved ✓' : 'Save settings'}
//         </button>
//       </Card>
//     </>
//   )
// }






import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const fields = [
  { key: 'cpu', label: 'CPU threshold', unit: '%', min: 50, max: 100 },
  { key: 'memory', label: 'Memory threshold', unit: '%', min: 50, max: 100 },
  { key: 'failures', label: 'Consecutive failed health checks', unit: '', min: 1, max: 10 },
  { key: 'interval', label: 'Health-check interval', unit: 's', min: 5, max: 120 },
]

export default function Settings() {
  const { data, loading, error, reload } = useApi(() => api.get('/api/settings'))
  const [values, setValues] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  if (loading || !values) return error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />

  const save = async () => {
    try {
      await api.put('/api/settings', values)
      setStatus('Saved ✓')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
    setTimeout(() => setStatus(''), 2500)
  }

  return (
    <>
      <PageHeader title="Settings" description="Failure-detection thresholds (stored in the database)" />
      <Card title="Detection thresholds" className="max-w-2xl">
        <div className="space-y-6">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="mb-2 flex justify-between text-sm">
                <label className="text-slate-300">{f.label}</label>
                <span className="font-semibold text-blue-400">{values[f.key]}{f.unit}</span>
              </div>
              <input type="range" min={f.min} max={f.max} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: Number(e.target.value) })} className="w-full accent-blue-500" />
            </div>
          ))}
        </div>
        <button onClick={save} className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          <Save size={15} /> {status || 'Save settings'}
        </button>
      </Card>
    </>
  )
}