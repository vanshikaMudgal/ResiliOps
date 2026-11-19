import { useEffect, useState } from 'react'
import { Save, Sliders, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const fields = [
  { key: 'cpu', label: 'Host CPU Alert Threshold', unit: '%', min: 50, max: 100, step: 1, desc: 'Triggers HIGH incident if CPU exceeds this limit' },
  { key: 'memory', label: 'Host Memory Alert Threshold', unit: '%', min: 50, max: 100, step: 1, desc: 'Triggers HIGH incident if RAM exceeds this limit' },
  { key: 'failures', label: 'Consecutive Failed Health Checks', unit: '', min: 1, max: 10, step: 1, desc: 'Marks application DOWN and generates CRITICAL incident' },
  { key: 'interval', label: 'Health Check Polling Interval', unit: 's', min: 5, max: 120, step: 1, desc: 'Frequency at which background worker probes application endpoints' },
  { key: 'response', label: 'Response Latency Threshold', unit: 'ms', min: 50, max: 2000, step: 50, desc: 'Triggers MEDIUM incident and marks app DEGRADED if response is slower' },
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
      setStatus('Thresholds Saved Successfully ✓')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
    setTimeout(() => setStatus(''), 2500)
  }

  return (
    <>
      <PageHeader
        title="Monitoring Settings"
        description="Configure dynamic failure detection thresholds and health check parameters (stored in SQLite)"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Failure Detection Thresholds" subtitle="Adjust threshold parameters for autonomous alerts" className="lg:col-span-2">
          <div className="space-y-6">
            {fields.map((f) => (
              <div key={f.key} className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3.5">
                <div className="mb-1.5 flex justify-between text-sm">
                  <label className="font-medium text-slate-200">{f.label}</label>
                  <span className="font-mono font-semibold text-blue-400">
                    {values[f.key] ?? (f.key === 'response' ? 500 : 80)}
                    {f.unit}
                  </span>
                </div>
                <p className="mb-3 text-xs text-slate-500">{f.desc}</p>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step || 1}
                  value={values[f.key] ?? (f.key === 'response' ? 500 : 80)}
                  onChange={(e) => setValues({ ...values, [f.key]: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
          <button
            onClick={save}
            className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Save size={16} /> {status || 'Save Settings'}
          </button>
        </Card>

        <Card title="Detection Engine Logic" subtitle="Academic evaluation reference">
          <div className="space-y-4 text-xs text-slate-400">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold text-slate-200">Non-Blocking Daemon</p>
                <p className="mt-0.5">Background asyncio runner probes microservices at the configured interval without interrupting API requests.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold text-slate-200">Incident Deduplication</p>
                <p className="mt-0.5">If an incident for an active failure condition is already OPEN or INVESTIGATING, duplicate incident spam is automatically prevented.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-violet-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold text-slate-200">Auto-Resolution</p>
                <p className="mt-0.5">When consecutive check failures return to zero or CPU normalizes below threshold, active incidents auto-resolve.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Sliders className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold text-slate-200">Prometheus Metric Exporter</p>
                <p className="mt-0.5">Metrics are continuously refreshed and scraped by Prometheus on port 9090 from the <code>/metrics</code> endpoint.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
