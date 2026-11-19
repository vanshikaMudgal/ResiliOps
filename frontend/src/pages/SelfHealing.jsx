import { useState } from 'react'
import {
  RotateCcw,
  TrendingUp,
  Undo2,
  Container,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Save,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Sliders,
  Flame,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import MetricCard from '../components/ui/MetricCard'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

export default function SelfHealing() {
  const { data, loading, error, reload } = useApi(
    () =>
      Promise.all([
        api.get('/api/recovery'),
        api.get('/api/recovery/policies'),
        api.get('/api/recovery/infrastructure-status'),
        api.get('/api/applications'),
        api.get('/api/infrastructure/replica-history'),
      ]),
    3000 // Real-time 3s refresh
  )

  const [policyForm, setPolicyForm] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [actionInProgress, setActionInProgress] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [healingActions, policy, infraStatus, applications, replicaSeries] = data
  const currentPolicy = policyForm || policy

  const successfulRecoveries = healingActions.filter((h) => h.result === 'success' || h.status === 'SUCCESS').length
  const failedRecoveries = healingActions.filter((h) => h.result === 'failed' || h.status === 'FAILED').length
  const appsNeedingHealing = applications.filter((a) => a.status === 'down').length

  const filteredHistory = healingActions.filter((h) => {
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'success'
        ? h.result === 'success' || h.status === 'SUCCESS'
        : h.result === 'failed' || h.status === 'FAILED'
    const matchAction = filterAction === 'all' ? true : h.action.toLowerCase().includes(filterAction.toLowerCase())
    return matchStatus && matchAction
  })

  const savePolicies = async () => {
    try {
      await api.put('/api/recovery/policies', currentPolicy)
      setSaveStatus('Policies saved successfully ✓')
      reload()
    } catch (err) {
      setSaveStatus(`Save error: ${err.message}`)
    }
    setTimeout(() => setSaveStatus(''), 2500)
  }

  const executeAction = async (appId, actionType) => {
    setActionInProgress(true)
    setActionMsg(`Executing ${actionType} remediation...`)
    try {
      const res = await api.post('/api/recovery/execute', {
        app_id: appId,
        action_type: actionType,
      })
      setActionMsg(`Remediation completed: ${res.id} (${res.status}) - ${res.details}`)
      reload()
    } catch (err) {
      setActionMsg(`Remediation error: ${err.message}`)
    } finally {
      setActionInProgress(false)
      setTimeout(() => setActionMsg(''), 5000)
    }
  }

  const retryAction = async (code) => {
    setActionMsg(`Retrying recovery action ${code}...`)
    try {
      const res = await api.post(`/api/recovery/${code}/retry`)
      setActionMsg(`Retry completed: ${res.status} - ${res.details}`)
      reload()
    } catch (err) {
      setActionMsg(`Retry failed: ${err.message}`)
    }
    setTimeout(() => setActionMsg(''), 5000)
  }

  return (
    <>
      <PageHeader
        title="Self-Healing & Autonomous Recovery"
        description="Automated Docker container remediation, Kubernetes pod recovery, deployment rollback, and autoscaling"
        action={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                infraStatus?.docker?.docker_available
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              <HardDrive size={13} />
              Docker: {infraStatus?.docker?.docker_available ? 'Connected' : 'Offline'}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                infraStatus?.kubernetes?.available
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400'
              }`}
            >
              <RotateCcw size={13} />
              K8s: {infraStatus?.kubernetes?.available ? 'Connected' : 'Demonstration Mode'}
            </span>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Successful Recoveries"
          value={successfulRecoveries}
          hint="Verified healthy post-remediation"
          tone="green"
        />
        <MetricCard
          icon={XCircle}
          label="Failed Recoveries"
          value={failedRecoveries}
          hint="Exceeded limits or timed out"
          tone={failedRecoveries > 0 ? 'red' : 'green'}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Apps Requiring Healing"
          value={appsNeedingHealing}
          hint={appsNeedingHealing > 0 ? 'Remediation in progress' : 'All services healthy'}
          tone={appsNeedingHealing > 0 ? 'red' : 'green'}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Recovery Engine State"
          value={currentPolicy.autoRecoveryEnabled ? 'ACTIVE' : 'PAUSED'}
          hint={`Cooldown: ${currentPolicy.cooldownSeconds}s · Retries: ${currentPolicy.maxAttempts}`}
          tone={currentPolicy.autoRecoveryEnabled ? 'violet' : 'amber'}
        />
      </div>

      {actionMsg && (
        <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-950/40 p-3 text-xs font-medium text-blue-300">
          ℹ️ {actionMsg}
        </div>
      )}

      {/* Recovery Policies Management */}
      <Card title="Recovery Policies & Automation Permissions" subtitle="Configurable rules governing autonomous remediation" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <ShieldCheck size={18} />
              </span>
              <button
                onClick={() => setPolicyForm({ ...currentPolicy, autoRecoveryEnabled: !currentPolicy.autoRecoveryEnabled })}
                className={`relative h-6 w-11 rounded-full transition ${currentPolicy.autoRecoveryEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${currentPolicy.autoRecoveryEnabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100">Master Auto-Recovery</h4>
            <p className="mt-1 text-xs text-slate-500">Enable autonomous recovery when failures are detected</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Container size={18} />
              </span>
              <button
                onClick={() => setPolicyForm({ ...currentPolicy, allowRestart: !currentPolicy.allowRestart })}
                className={`relative h-6 w-11 rounded-full transition ${currentPolicy.allowRestart ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${currentPolicy.allowRestart ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100">Docker Container Restart</h4>
            <p className="mt-1 text-xs text-slate-500">Restart affected Docker container after 3 consecutive failures</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <Undo2 size={18} />
              </span>
              <button
                onClick={() => setPolicyForm({ ...currentPolicy, allowRollback: !currentPolicy.allowRollback })}
                className={`relative h-6 w-11 rounded-full transition ${currentPolicy.allowRollback ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${currentPolicy.allowRollback ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100">Auto Deployment Rollback</h4>
            <p className="mt-1 text-xs text-slate-500">Revert deployment to previous known-good version if errors spike</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <TrendingUp size={18} />
              </span>
              <button
                onClick={() => setPolicyForm({ ...currentPolicy, allowScaling: !currentPolicy.allowScaling })}
                className={`relative h-6 w-11 rounded-full transition ${currentPolicy.allowScaling ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${currentPolicy.allowScaling ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100">Autoscaling (K8s/Docker)</h4>
            <p className="mt-1 text-xs text-slate-500">Scale replica count up when CPU exceeds alert threshold</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-400">Max Recovery Attempts before Lockout:</span>
              <span className="font-mono font-semibold text-blue-400">{currentPolicy.maxAttempts} attempts</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={currentPolicy.maxAttempts}
              onChange={(e) => setPolicyForm({ ...currentPolicy, maxAttempts: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-400">Cooldown Period between Retries:</span>
              <span className="font-mono font-semibold text-blue-400">{currentPolicy.cooldownSeconds} seconds</span>
            </div>
            <input
              type="range"
              min={10}
              max={180}
              step={10}
              value={currentPolicy.cooldownSeconds}
              onChange={(e) => setPolicyForm({ ...currentPolicy, cooldownSeconds: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={savePolicies}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500"
          >
            <Save size={14} /> {saveStatus || 'Save Policy Settings'}
          </button>
          <span className="text-xs text-slate-500">Protects against infinite restart loops & resource exhaustion</span>
        </div>
      </Card>

      {/* Autoscaling Chart & Live Remediation Control */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Live Autoscaling Telemetry" subtitle="Replica count adjustment over time" className="xl:col-span-1">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={replicaSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} domain={[0, 6]} unit=" pods" />
                <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Line type="stepAfter" dataKey="replicas" name="Replicas" stroke="#8b5cf6" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Target Remediation & Action Triggers */}
        <Card title="Remediation Triggers & Testing Panel" subtitle="Demonstrate Docker, Kubernetes, Rollback, and Scaling remediation" className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} className="rounded-xl border border-slate-800 bg-[#0f1523] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">{app.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Ver: {app.version} · {app.replicas} Replicas</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 font-mono truncate">{app.url}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => executeAction(app.id, 'Container Restart')}
                    disabled={actionInProgress}
                    className="flex items-center justify-center gap-1 rounded bg-slate-800 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    <Container size={12} /> Restart
                  </button>

                  <button
                    onClick={() => executeAction(app.id, 'Rollback')}
                    disabled={actionInProgress}
                    className="flex items-center justify-center gap-1 rounded bg-violet-600/20 text-violet-300 py-1.5 text-[11px] font-medium hover:bg-violet-600/30 transition disabled:opacity-50"
                  >
                    <Undo2 size={12} /> Rollback
                  </button>

                  <button
                    onClick={() => executeAction(app.id, 'Autoscale')}
                    disabled={actionInProgress}
                    className="flex items-center justify-center gap-1 rounded bg-amber-600/20 text-amber-300 py-1.5 text-[11px] font-medium hover:bg-amber-600/30 transition disabled:opacity-50"
                  >
                    <TrendingUp size={12} /> Autoscale (+2)
                  </button>

                  <button
                    onClick={() => executeAction(app.id, 'Pod Restart')}
                    disabled={actionInProgress}
                    className="flex items-center justify-center gap-1 rounded bg-blue-600/20 text-blue-300 py-1.5 text-[11px] font-medium hover:bg-blue-600/30 transition disabled:opacity-50"
                  >
                    <RotateCcw size={12} /> Recreate Pod
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recovery History Table */}
      <Card title="Self-Healing Operation History" subtitle="Audit trail of automated and manual recovery executions" className="mt-6 overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="self-center text-slate-500 mr-1">Status:</span>
            {['all', 'success', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-2.5 py-1 capitalize font-medium ${
                  filterStatus === st
                    ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
            <span className="self-center text-slate-500 ml-2 mr-1">Action:</span>
            {['all', 'Container Restart', 'Rollback', 'Autoscale', 'Pod Restart'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`rounded-lg px-2.5 py-1 capitalize font-medium ${
                  filterAction === act
                    ? 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredHistory.length} recovery records</span>
        </div>

        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-slate-500 border-b border-slate-800 bg-slate-900/30">
            <tr>
              <th className="px-4 py-3">Recovery ID</th>
              <th>Incident</th>
              <th>Application</th>
              <th>Action & Target</th>
              <th>Execution Status</th>
              <th>Result</th>
              <th>Time</th>
              <th className="px-4 text-right">Retry</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((h) => (
              <tr key={h.id} className="border-t border-slate-800 text-xs hover:bg-slate-800/20">
                <td className="px-4 py-3 font-mono font-medium text-slate-300">{h.id}</td>
                <td className="font-mono text-slate-400">{h.incident || '—'}</td>
                <td className="font-medium text-slate-200">{h.app}</td>
                <td>
                  <p className="font-medium text-slate-200">{h.action}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{h.target || h.details}</p>
                </td>
                <td>
                  <span
                    className={`rounded px-2 py-0.5 font-semibold text-[10px] uppercase ${
                      h.status === 'SUCCESS' || h.result === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {h.status || (h.result === 'success' ? 'SUCCESS' : 'FAILED')}
                  </span>
                </td>
                <td>
                  <StatusBadge status={h.result} />
                </td>
                <td className="text-slate-400">{h.time}</td>
                <td className="px-4 text-right">
                  {h.result === 'failed' || h.status === 'FAILED' ? (
                    <button
                      onClick={() => retryAction(h.id)}
                      className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition"
                    >
                      Retry
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-600">
                  No recovery records match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}
