import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Applications from './pages/Applications'
import Deployments from './pages/Deployments'
import Monitoring from './pages/Monitoring'
import Incidents from './pages/Incidents'
import SelfHealing from './pages/SelfHealing'
import Infrastructure from './pages/Infrastructure'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="applications" element={<Applications />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="self-healing" element={<SelfHealing />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}