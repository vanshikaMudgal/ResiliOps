import { HeartPulse, Boxes, AlertTriangle, Rocket, CheckCircle2, XCircle, RefreshCw, Cpu } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const dot = { incident: 'bg-red-400', heal: 'bg-violet-400', deploy: 'bg-blue-400', app: 'bg-emerald-400' }

export default function Overview() {
  const { data, loading, error, reload } = useApi(
    () =>
      Promise.all([
        api.get('/api/applications'),
        api.get('/api/deployments'),
        api.get('/api/incidents'),
        api.get('/api/recovery-actions'),
        api.get('/api/activities'),
        api.get('/api/monitoring/metrics'),
        api.get('/api/monitoring/overview'),
      ]),
    3000 // Real-time 3s refresh
  )

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [applications, deployments, incidents, healingActions, activities, metricSeries, monOverview] = data
  const healthy = applications.filter((a) => a.status === 'healthy').length
  const failedApps = applications.filter((a) => a.status === 'down').length
  const score = applications.length ? Math.round((healthy / applications.length) * 100) : 0
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length
  const success = deployments.filter((d) => d.status === 'success').length
  const failed = deployments.filter((d) => d.status === 'failed').length
  const hostCpu = monOverview?.host_cpu_percent ?? 0

  return (
    <>
      <PageHeader title="Platform Overview" description="Real-time telemetry, failure detection, and health status" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={HeartPulse}
          label="System health"
          value={`${score}%`}
          hint={`${healthy} of ${applications.length} apps healthy (${failedApps} down)`}
          tone={score > 80 ? 'green' : score > 50 ? 'amber' : 'red'}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Active incidents"
          value={activeIncidents}
          hint={activeIncidents > 0 ? 'Requires attention' : 'All clear'}
          tone={activeIncidents > 0 ? 'red' : 'green'}
        />
        <MetricCard icon={Rocket} label="Total deployments" value={deployments.length} hint="All recorded" tone="blue" />
        <MetricCard icon={RefreshCw} label="Recovery actions" value={healingActions.length} hint="Auto-healing ready" tone="violet" />
        <MetricCard icon={CheckCircle2} label="Successful deploys" value={success} tone="green" />
        <MetricCard icon={XCircle} label="Failed deploys" value={failed} tone="red" />
        <MetricCard icon={Cpu} label="Host CPU (psutil)" value={`${hostCpu}%`} hint="Telemetry from host" tone={hostCpu > 80 ? 'red' : 'amber'} />
        <MetricCard icon={Boxes} label="Applications" value={applications.length} hint={`${monOverview?.monitored_applications ?? 0} actively monitored`} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="CPU & Memory Utilization" subtitle="Real-time host resource telemetry" className="xl:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricSeries}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" fill="url(#gc)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="memory" name="Memory %" stroke="#8b5cf6" fill="url(#gm)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Application Health Status">
          <ul className="space-y-3">
            {applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-300">{a.name}</span>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {a.status === 'down' ? 'HTTP 503 Unreachable' : `${a.responseMs} ms`}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recent Activity" subtitle="Deployment, incident, and telemetry timeline">
          <ol className="relative space-y-5 border-l border-slate-800 pl-5">
            {activities.map((a, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#0f1523] ${dot[a.type] || 'bg-slate-400'}`} />
                <p className="text-sm text-slate-300">{a.message}</p>
                <p className="text-xs text-slate-600">{a.time}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Active Incidents" subtitle="Automated failure detection alerts">
          <div className="space-y-3">
            {incidents.filter((i) => i.status !== 'resolved').map((i) => (
              <div key={i.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-200">{i.title}</p>
                  <StatusBadge status={i.severity} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{i.cause}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{i.id} · {i.app}</span>
                  <span>{i.detectedAt}</span>
                </div>
              </div>
            ))}
            {activeIncidents === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No active incidents. All monitored applications are operating within threshold parameters 🎉
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
