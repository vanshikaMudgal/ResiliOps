import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import {
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const tip = {
  contentStyle: { background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 },
}

export default function Monitoring() {
  const { data, loading, error, reload } = useApi(
    () =>
      Promise.all([
        api.get('/api/applications'),
        api.get('/api/monitoring/metrics'),
        api.get('/api/settings'),
        api.get('/api/monitoring/overview'),
        api.get('/api/monitoring/logs'),
      ]),
    3000 // Poll every 3 seconds for dynamic real-time telemetry
  )

  const [actionMsg, setActionMsg] = useState('')
  const [triggering, setTriggering] = useState(false)

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [applications, metricSeries, settings, overview, logs] = data

  const triggerNow = async () => {
    setTriggering(true)
    try {
      await api.post('/api/monitoring/check-now')
      setActionMsg('Health check cycle completed!')
      reload()
    } catch (err) {
      setActionMsg(`Check failed: ${err.message}`)
    } finally {
      setTriggering(false)
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  const simulateCpu = async () => {
    setActionMsg('Generating controlled CPU load (4s)...')
    try {
      await api.post('/api/monitoring/simulate/cpu-load', { duration_seconds: 4 })
      setActionMsg('CPU load completed! Check incident & chart.')
      reload()
    } catch (err) {
      setActionMsg(`Simulation error: ${err.message}`)
    }
    setTimeout(() => setActionMsg(''), 4000)
  }

  const toggleTestApp = async (state) => {
    try {
      await api.post('/api/monitoring/simulate/test-app-state', { state })
      await api.post('/api/monitoring/check-now')
      setActionMsg(`Test App state set to '${state}' & checked!`)
      reload()
    } catch (err) {
      setActionMsg(`Toggle error: ${err.message}`)
    }
    setTimeout(() => setActionMsg(''), 3500)
  }

  const getCodeColor = (code) => {
    if (!code || code === '—') return 'text-slate-500'
    if (code >= 200 && code < 300) return 'text-emerald-400'
    if (code >= 400 && code < 500) return 'text-amber-400'
    return 'text-red-400'
  }

  const getLatencyColor = (ms) => {
    if (ms === 0 || ms === '—') return 'text-slate-500'
    if (ms < 100) return 'text-emerald-400'
    if (ms < (settings.response || 500)) return 'text-amber-400'
    return 'text-red-400 font-semibold'
  }

  return (
    <>
      <PageHeader
        title="Live Monitoring & Telemetry"
        description="Real-time system resource collection, Prometheus metrics, and HTTP health-check engine"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={triggerNow}
              disabled={triggering}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={13} className={triggering ? 'animate-spin' : ''} />
              Run Check Now
            </button>
            <a
              href="http://localhost:8000/metrics"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
            >
              <Radio size={13} />
              /metrics
            </a>
          </div>
        }
      />

      {/* Host psutil telemetry pill strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f1523] p-4">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
            <Cpu size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Host CPU (psutil)</p>
            <p className="text-lg font-bold text-slate-100">{overview.host_cpu_percent}%</p>
            <p className="text-[11px] text-slate-400">Alert threshold: {settings.cpu}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f1523] p-4">
          <div className="rounded-lg bg-violet-500/10 p-2.5 text-violet-400">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Host RAM (psutil)</p>
            <p className="text-lg font-bold text-slate-100">{overview.host_memory_percent}%</p>
            <p className="text-[11px] text-slate-400">
              {overview.host_memory_used_gb} / {overview.host_memory_total_gb} GB used
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f1523] p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Monitored Apps</p>
            <p className="text-lg font-bold text-slate-100">
              {overview.healthy_applications} / {overview.total_applications} UP
            </p>
            <p className="text-[11px] text-slate-400">{overview.down_applications} down</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f1523] p-4">
          <div className="rounded-lg bg-red-500/10 p-2.5 text-red-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Incidents</p>
            <p className="text-lg font-bold text-slate-100">{overview.active_incidents}</p>
            <p className="text-[11px] text-slate-400">Failure detector active</p>
          </div>
        </div>
      </div>

      {/* Interactive Viva Demonstration Controls */}
      <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Radio size={14} className="animate-pulse text-blue-400" />
              EXAMINATION DEMO CONTROLS
            </span>
            <p className="text-xs text-slate-400">
              Demonstrate failure detection, health checks, and incidents live during evaluation:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleTestApp('healthy')}
              className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"
            >
              Test App: 200 OK
            </button>
            <button
              onClick={() => toggleTestApp('slow')}
              className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/20"
            >
              Test App: Latency Spike
            </button>
            <button
              onClick={() => toggleTestApp('failing')}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/20"
            >
              Test App: Crash (500 Error)
            </button>
            <button
              onClick={simulateCpu}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 ring-1 ring-orange-500/30 hover:bg-orange-500/20"
            >
              <Flame size={13} />
              Spike CPU
            </button>
          </div>
        </div>
        {actionMsg && (
          <p className="mt-2 text-xs font-medium text-blue-300 animate-fadeIn">ℹ️ {actionMsg}</p>
        )}
      </div>

      {/* Live Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="CPU Utilization (Host psutil)" subtitle={`Alert Threshold: ${settings.cpu}%`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine
                  y={settings.cpu}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Threshold', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Memory Utilization (Host psutil)" subtitle={`Alert Threshold: ${settings.memory}%`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine
                  y={settings.memory}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Threshold', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  name="Memory %"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Application Response Time"
          subtitle={`Cluster average latency (Threshold: ${settings.response || 500} ms)`}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit=" ms" />
                <Tooltip {...tip} />
                <ReferenceLine
                  y={settings.response || 500}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                />
                <Bar dataKey="response" name="Latency (ms)" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Application Uptime" subtitle="Health check availability score">
          <ul className="space-y-4">
            {applications.map((a) => (
              <li key={a.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{a.name}</span>
                  <span className="text-slate-400 font-mono text-xs">{a.uptime}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${
                      a.status === 'down'
                        ? 'bg-red-500'
                        : a.uptime > 99
                        ? 'bg-emerald-500'
                        : a.uptime > 97
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${a.status === 'down' ? 5 : a.uptime}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* HTTP Health Checks Table */}
      <Card
        title="HTTP Health Checks"
        subtitle={`Interval: ${settings.interval}s · Failure threshold: ${settings.failures} consecutive checks`}
        className="mt-6 overflow-x-auto"
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="pb-3">Application</th>
              <th>Endpoint URL</th>
              <th>HTTP Code</th>
              <th>Latency</th>
              <th>Consecutive Fails</th>
              <th>Last Checked</th>
              <th>Health Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-t border-slate-800">
                <td className="py-3 font-medium text-slate-200">{a.name}</td>
                <td className="font-mono text-xs text-slate-500 max-w-[200px] truncate" title={a.url}>
                  {a.url}
                </td>
                <td className={`font-mono text-xs ${getCodeColor(a.statusCode)}`}>
                  {a.statusCode || (a.status === 'down' ? 503 : 200)}
                </td>
                <td className={`font-mono text-xs ${getLatencyColor(a.responseMs)}`}>
                  {a.status === 'down' ? '—' : `${a.responseMs} ms`}
                </td>
                <td className="text-xs">
                  {a.consecutiveFailures > 0 ? (
                    <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-red-400">
                      {a.consecutiveFailures} / {settings.failures}
                      {a.consecutiveFailures >= settings.failures ? ' (Alert)' : ''}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">0 / {settings.failures}</span>
                  )}
                </td>
                <td className="text-xs text-slate-400">{a.lastCheck || 'just now'}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Monitoring Logs & Anomalies */}
      <Card
        title="Monitoring Audit Logs & Detected Anomalies"
        subtitle="Recent health check results, failure triggers, and metric collection events"
        className="mt-6 overflow-x-auto"
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="pb-3">Time</th>
              <th>Level</th>
              <th>Source</th>
              <th>Event Message</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? (
              logs.slice(0, 10).map((l) => (
                <tr key={l.id} className="border-t border-slate-800 text-xs">
                  <td className="py-2.5 text-slate-500 whitespace-nowrap">{l.time}</td>
                  <td>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        l.level === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : l.level === 'ERROR'
                          ? 'bg-rose-500/10 text-rose-400'
                          : l.level === 'WARN'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {l.level}
                    </span>
                  </td>
                  <td className="font-mono text-slate-400">{l.source}</td>
                  <td className="font-medium text-slate-200">{l.message}</td>
                  <td className="text-slate-500 truncate max-w-xs">{l.details || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-600">
                  No monitoring logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}
