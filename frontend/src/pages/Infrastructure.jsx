// import { useState } from 'react'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { k8sPods, k8sDeployments, terraformResources } from '../data/mockData'

// export default function Infrastructure() {
//   const [tab, setTab] = useState('k8s')
//   const tabs = [['k8s', 'Kubernetes'], ['tf', 'Terraform']]

//   return (
//     <>
//       <PageHeader title="Infrastructure" description="Kubernetes workloads and Terraform-managed resources" />

//       <div className="mb-4 flex gap-2">
//         {tabs.map(([k, label]) => (
//           <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30' : 'bg-slate-800/60 text-slate-400'}`}>{label}</button>
//         ))}
//       </div>

//       {tab === 'k8s' && (
//         <div className="space-y-6">
//           <Card title="Deployments" className="overflow-x-auto">
//             <table className="w-full min-w-[420px] text-left text-sm">
//               <thead className="text-xs text-slate-500"><tr><th className="pb-3">Name</th><th>Ready</th><th>Up-to-date</th><th>Available</th></tr></thead>
//               <tbody>
//                 {k8sDeployments.map((d) => (
//                   <tr key={d.name} className="border-t border-slate-800">
//                     <td className="py-3 font-mono text-xs text-slate-200">{d.name}</td>
//                     <td className="text-slate-300">{d.ready}</td><td className="text-slate-300">{d.upToDate}</td><td className="text-slate-300">{d.available}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Card>
//           <Card title="Pods" className="overflow-x-auto">
//             <table className="w-full min-w-[560px] text-left text-sm">
//               <thead className="text-xs text-slate-500"><tr><th className="pb-3">Name</th><th>Namespace</th><th>Status</th><th>Restarts</th><th>Node</th><th>Age</th></tr></thead>
//               <tbody>
//                 {k8sPods.map((p) => (
//                   <tr key={p.name} className="border-t border-slate-800">
//                     <td className="py-3 font-mono text-xs text-slate-200">{p.name}</td>
//                     <td className="text-slate-400">{p.ns}</td>
//                     <td><StatusBadge status={p.status} /></td>
//                     <td className="text-slate-300">{p.restarts}</td>
//                     <td className="text-slate-400">{p.node}</td>
//                     <td className="text-slate-500">{p.age}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Card>
//         </div>
//       )}

//       {tab === 'tf' && (
//         <Card title="Terraform resources" subtitle="Provisioned locally using the Docker provider">
//           <ul className="space-y-3">
//             {terraformResources.map((r) => (
//               <li key={r.name} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3">
//                 <div>
//                   <p className="font-mono text-sm text-slate-200">{r.type}.{r.name}</p>
//                 </div>
//                 <StatusBadge status={r.status} />
//               </li>
//             ))}
//           </ul>
//         </Card>
//       )}
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

export default function Infrastructure() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([
      api.get('/api/infrastructure/pods'),
      api.get('/api/infrastructure/deployments'),
      api.get('/api/infrastructure/terraform'),
    ])
  )
  const [tab, setTab] = useState('k8s')
  const tabs = [['k8s', 'Kubernetes'], ['tf', 'Terraform']]

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [k8sPods, k8sDeployments, terraformResources] = data

  return (
    <>
      <PageHeader title="Infrastructure" description="Kubernetes workloads and Terraform-managed resources (sample data until Phases 4-5)" />

      <div className="mb-4 flex gap-2">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30' : 'bg-slate-800/60 text-slate-400'}`}>{label}</button>
        ))}
      </div>

      {tab === 'k8s' && (
        <div className="space-y-6">
          <Card title="Deployments" className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="pb-3">Name</th><th>Ready</th><th>Up-to-date</th><th>Available</th></tr></thead>
              <tbody>
                {k8sDeployments.map((d) => (
                  <tr key={d.name} className="border-t border-slate-800">
                    <td className="py-3 font-mono text-xs text-slate-200">{d.name}</td>
                    <td className="text-slate-300">{d.ready}</td><td className="text-slate-300">{d.upToDate}</td><td className="text-slate-300">{d.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Pods" className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="pb-3">Name</th><th>Namespace</th><th>Status</th><th>Restarts</th><th>Node</th><th>Age</th></tr></thead>
              <tbody>
                {k8sPods.map((p) => (
                  <tr key={p.name} className="border-t border-slate-800">
                    <td className="py-3 font-mono text-xs text-slate-200">{p.name}</td>
                    <td className="text-slate-400">{p.ns}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-slate-300">{p.restarts}</td>
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
        <Card title="Terraform resources" subtitle="Provisioned locally using the Docker provider">
          <ul className="space-y-3">
            {terraformResources.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                <p className="font-mono text-sm text-slate-200">{r.type}.{r.name}</p>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}