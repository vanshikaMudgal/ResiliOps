import { useState } from 'react'
import { Server, Layers, HardDrive, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

export default function Infrastructure() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([
      api.get('/api/infrastructure/pods'),
      api.get('/api/infrastructure/deployments'),
      api.get('/api/infrastructure/terraform'),
      api.get('/api/infrastructure/status'),
    ]),
    5000
  )
  const [tab, setTab] = useState('k8s')
  const tabs = [['k8s', 'Kubernetes'], ['tf', 'Terraform & Docker']]

  if (loading && !data) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [k8sPods, k8sDeployments, terraformResources, clusterStatus] = data

  return (
    <>
      <PageHeader
        title="Infrastructure & Orchestration"
        description="Kubernetes cluster workloads, container pods, and Terraform-managed infrastructure"
      />

      {/* Cluster Status Banner */}
      <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
        clusterStatus?.available
          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
          : 'border-blue-500/30 bg-blue-950/20 text-blue-300'
      }`}>
        <Info size={18} className="mt-0.5 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-slate-100">
            {clusterStatus?.available ? 'Kubernetes Cluster: Active' : 'Kubernetes: Academic Demonstration Mode'}
          </p>
          <p className="mt-0.5 text-slate-400">
            {clusterStatus?.message || "To connect a live local cluster, run 'minikube start' and apply manifests from 'k8s/sample-app.yaml'."}
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === k ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'k8s' && (
        <div className="space-y-6">
          <Card title="Deployments" subtitle="Kubernetes Deployment controllers & available replica sets" className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Deployment Name</th>
                  <th>Ready Replicas</th>
                  <th>Up-to-Date</th>
                  <th>Available</th>
                  <th>Environment</th>
                </tr>
              </thead>
              <tbody>
                {k8sDeployments.map((d) => (
                  <tr key={d.name} className="border-t border-slate-800 text-xs">
                    <td className="py-3 font-mono font-medium text-slate-200">{d.name}</td>
                    <td className="font-mono text-emerald-400 font-semibold">{d.ready}</td>
                    <td className="text-slate-300">{d.upToDate}</td>
                    <td className="text-slate-300">{d.available}</td>
                    <td>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {d.is_live ? 'Live Minikube' : 'Cluster Spec'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Kubernetes Pods" subtitle="Container pods running across cluster nodes" className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Pod Identifier</th>
                  <th>Namespace</th>
                  <th>Status</th>
                  <th>Restarts</th>
                  <th>Node</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {k8sPods.map((p) => (
                  <tr key={p.name} className="border-t border-slate-800 text-xs">
                    <td className="py-3 font-mono text-slate-200">{p.name}</td>
                    <td className="text-slate-400">{p.ns}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-slate-300 font-mono">{p.restarts}</td>
                    <td className="text-slate-400">{p.node}</td>
                    <td className="text-slate-500">{p.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'tf' && (
        <Card title="Terraform Infrastructure Resources" subtitle="Locally provisioned container infrastructure">
          <ul className="space-y-3">
            {terraformResources.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3 border border-slate-800/60">
                <div>
                  <p className="font-mono text-sm text-slate-200">{r.type}.{r.name}</p>
                  <p className="text-xs text-slate-500">Provider: local-docker · State: active</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
