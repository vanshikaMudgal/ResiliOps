// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
// import PageHeader from '../components/ui/PageHeader'
// import Card from '../components/ui/Card'
// import StatusBadge from '../components/ui/StatusBadge'
// import { applications, metricSeries } from '../data/mockData'

// const tip = { contentStyle: { background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 } }

// export default function Monitoring() {
//   return (
//     <>
//       <PageHeader title="Monitoring" description="Metrics, uptime and health checks (Prometheus integration comes in Phase 3)" />

//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card title="CPU utilization" subtitle="Threshold: 80%">
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={metricSeries}>
//                 <CartesianGrid stroke="#1e293b" vertical={false} />
//                 <XAxis dataKey="time" stroke="#475569" fontSize={11} />
//                 <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
//                 <Tooltip {...tip} />
//                 <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" />
//                 <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>

//         <Card title="Memory utilization" subtitle="Threshold: 85%">
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={metricSeries}>
//                 <CartesianGrid stroke="#1e293b" vertical={false} />
//                 <XAxis dataKey="time" stroke="#475569" fontSize={11} />
//                 <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
//                 <Tooltip {...tip} />
//                 <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4" />
//                 <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>

//         <Card title="Response time" subtitle="Milliseconds">
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={metricSeries}>
//                 <CartesianGrid stroke="#1e293b" vertical={false} />
//                 <XAxis dataKey="time" stroke="#475569" fontSize={11} />
//                 <YAxis stroke="#475569" fontSize={11} />
//                 <Tooltip {...tip} />
//                 <Bar dataKey="response" fill="#10b981" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>

//         <Card title="Uptime" subtitle="Last 30 days">
//           <ul className="space-y-4">
//             {applications.map((a) => (
//               <li key={a.id}>
//                 <div className="mb-1 flex justify-between text-sm">
//                   <span className="text-slate-300">{a.name}</span>
//                   <span className="text-slate-400">{a.uptime}%</span>
//                 </div>
//                 <div className="h-2 rounded-full bg-slate-800">
//                   <div className={`h-2 rounded-full ${a.uptime > 99 ? 'bg-emerald-500' : a.uptime > 97 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.uptime}%` }} />
//                 </div>
//               </li>
//             ))}
//           </ul>
//         </Card>
//       </div>

//       <Card title="HTTP health checks" subtitle="Checked every 30 seconds" className="mt-6 overflow-x-auto">
//         <table className="w-full min-w-[560px] text-left text-sm">
//           <thead className="text-xs text-slate-500"><tr><th className="pb-3">Application</th><th>Endpoint</th><th>HTTP code</th><th>Latency</th><th>Result</th></tr></thead>
//           <tbody>
//             {applications.map((a) => (
//               <tr key={a.id} className="border-t border-slate-800">
//                 <td className="py-3 text-slate-200">{a.name}</td>
//                 <td className="font-mono text-xs text-slate-500">{a.url}</td>
//                 <td className="text-slate-300">{a.status === 'down' ? 503 : 200}</td>
//                 <td className="text-slate-300">{a.status === 'down' ? '—' : `${a.responseMs} ms`}</td>
//                 <td><StatusBadge status={a.status === 'down' ? 'failed' : 'success'} /></td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </Card>
//     </>
//   )
// }











import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import { Loading, ErrorBox } from '../components/ui/Feedback'
import { api } from '../api/client'
import useApi from '../api/useApi'

const tip = { contentStyle: { background: '#0f1523', border: '1px solid #1e293b', borderRadius: 8 } }

export default function Monitoring() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.get('/api/applications'), api.get('/api/metrics'), api.get('/api/settings')]),
    5000
  )

  if (loading) return <Loading />
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />

  const [applications, metricSeries, settings] = data
  const code = (a) => (a.status === 'down' ? 503 : a.status === 'unknown' ? '—' : 200)

  return (
    <>
      <PageHeader title="Monitoring" description="Metrics, uptime and health checks (live collection and Prometheus come in Phase 3)" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="CPU utilization" subtitle={`Threshold: ${settings.cpu}%`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine y={settings.cpu} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Memory utilization" subtitle={`Threshold: ${settings.memory}%`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine y={settings.memory} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Response time" subtitle="Milliseconds">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricSeries}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip {...tip} />
                <Bar dataKey="response" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Uptime" subtitle="Last 30 days">
          <ul className="space-y-4">
            {applications.map((a) => (
              <li key={a.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{a.name}</span>
                  <span className="text-slate-400">{a.uptime}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className={`h-2 rounded-full ${a.uptime > 99 ? 'bg-emerald-500' : a.uptime > 97 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.uptime}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="HTTP health checks" subtitle={`Configured interval: ${settings.interval}s (shown from stored status until Phase 3)`} className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="pb-3">Application</th><th>Endpoint</th><th>HTTP code</th><th>Latency</th><th>Result</th></tr></thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-t border-slate-800">
                <td className="py-3 text-slate-200">{a.name}</td>
                <td className="font-mono text-xs text-slate-500">{a.url}</td>
                <td className="text-slate-300">{code(a)}</td>
                <td className="text-slate-300">{a.status === 'down' || a.status === 'unknown' ? '—' : `${a.responseMs} ms`}</td>
                <td><StatusBadge status={a.status === 'down' ? 'failed' : a.status === 'unknown' ? 'unknown' : 'success'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}