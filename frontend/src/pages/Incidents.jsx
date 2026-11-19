import { useState } from 'react'
import { CheckCircle2, AlertOctagon, Filter, ShieldAlert } from 'lucide-react'
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
    3000
  )
  const [filter, setFilter] = useState('all')
  const [resolvingId, setResolvingId] = useState(null)

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [incidents, healingActions] = data
  const list = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)

  const handleResolve = async (incidentId) => {
    setResolvingId(incidentId)
    try {
      await api.post(`/api/incidents/${incidentId}/resolve`)
      reload()
    } catch (err) {
      alert(`Could not resolve incident: ${err.message}`)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Incidents & Failure Detection Log"
        description="Autonomous incidents generated when thresholds are crossed or health checks fail"
        action={
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldAlert size={14} className="text-amber-400" />
            <span>Autonomous Engine: Active</span>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Showing {list.length} of {incidents.length} recorded incidents
        </p>
      </div>

      <Card className="overflow-x-auto !p-0">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="text-xs text-slate-500 border-b border-slate-800 bg-slate-900/30">
            <tr>
              <th className="px-5 py-3">Incident ID</th>
              <th>Application</th>
              <th>Incident Title & Cause</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Detected At</th>
              <th>Resolved At</th>
              <th className="px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-t border-slate-800 hover:bg-slate-800/20">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-300">{i.id}</td>
                <td className="font-medium text-slate-200 text-xs">{i.app}</td>
                <td>
                  <p className="text-xs font-medium text-slate-200">{i.title}</p>
                  <p className="text-[11px] text-slate-400">{i.cause}</p>
                </td>
                <td>
                  <StatusBadge status={i.severity} />
                </td>
                <td>
                  <StatusBadge status={i.status} />
                </td>
                <td className="text-xs text-slate-400">{i.detectedAt}</td>
                <td className="text-xs text-slate-400">{i.resolvedAt || '—'}</td>
                <td className="px-5 text-right">
                  {i.status !== 'resolved' ? (
                    <button
                      onClick={() => handleResolve(i.id)}
                      disabled={resolvingId === i.id}
                      className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-emerald-600 hover:text-white transition disabled:opacity-50"
                    >
                      {resolvingId === i.id ? 'Resolving...' : 'Resolve'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400/80 font-medium">Resolved ✓</span>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-600">
                  No incidents match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Self-Healing & Recovery History" subtitle="Automated remediation actions mapped to incidents" className="mt-6">
        <ul className="space-y-3">
          {healingActions.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/50 px-4 py-3 text-sm border border-slate-800/50"
            >
              <div>
                <span className="font-semibold text-slate-200">
                  {h.action} on {h.app}
                </span>
                <p className="text-xs text-slate-500">
                  Triggered for {h.incident || 'System Anomaly'} · {h.details}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{h.time}</span>
                <StatusBadge status={h.result} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
