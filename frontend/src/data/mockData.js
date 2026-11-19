export const applications = [
  { id: 1, name: 'Payment Service', url: 'http://payment-svc:8000/health', status: 'healthy', cpu: 42, memory: 61, uptime: 99.98, version: 'v2.4.1', replicas: 3, monitoring: true, lastDeploy: '2 hours ago', responseMs: 118 },
  { id: 2, name: 'Order API', url: 'http://order-api:8000/health', status: 'degraded', cpu: 87, memory: 74, uptime: 98.9, version: 'v1.9.0', replicas: 4, monitoring: true, lastDeploy: '35 min ago', responseMs: 640 },
  { id: 3, name: 'Auth Service', url: 'http://auth-svc:8000/health', status: 'healthy', cpu: 28, memory: 45, uptime: 99.99, version: 'v3.0.2', replicas: 2, monitoring: true, lastDeploy: '1 day ago', responseMs: 74 },
  { id: 4, name: 'Notification Worker', url: 'http://notify:8000/health', status: 'down', cpu: 0, memory: 0, uptime: 94.2, version: 'v1.2.5', replicas: 0, monitoring: true, lastDeploy: '3 hours ago', responseMs: 0 },
  { id: 5, name: 'Inventory Service', url: 'http://inventory:8000/health', status: 'healthy', cpu: 36, memory: 52, uptime: 99.95, version: 'v2.1.0', replicas: 2, monitoring: false, lastDeploy: '2 days ago', responseMs: 96 },
  { id: 6, name: 'Web Frontend', url: 'http://frontend:80/', status: 'healthy', cpu: 18, memory: 33, uptime: 100, version: 'v5.4.0', replicas: 3, monitoring: true, lastDeploy: '5 hours ago', responseMs: 45 },
]

export const deployments = [
  { id: 'DEP-1042', app: 'Order API', version: 'v1.9.0', status: 'success', branch: 'main', commit: 'a3f9c21', by: 'github-actions', time: '35 min ago', duration: '1m 48s',
    logs: ['[ci] Checkout repository', '[ci] Running unit tests... 24 passed', '[docker] Building image order-api:v1.9.0', '[docker] Pushing image', '[k8s] kubectl apply -f deployment.yaml', '[k8s] Rollout complete', '[done] Deployment successful'] },
  { id: 'DEP-1041', app: 'Notification Worker', version: 'v1.2.5', status: 'failed', branch: 'main', commit: 'be71d08', by: 'github-actions', time: '3 hours ago', duration: '0m 52s',
    logs: ['[ci] Checkout repository', '[ci] Running unit tests... 22 passed, 2 failed', '[ERROR] test_queue_connection failed', '[done] Pipeline aborted'] },
  { id: 'DEP-1040', app: 'Web Frontend', version: 'v5.4.0', status: 'success', branch: 'main', commit: '9c0d1ee', by: 'priya', time: '5 hours ago', duration: '2m 05s',
    logs: ['[ci] npm ci', '[ci] npm run build', '[docker] Building image frontend:v5.4.0', '[k8s] Rollout complete', '[done] Deployment successful'] },
  { id: 'DEP-1039', app: 'Payment Service', version: 'v2.4.1', status: 'success', branch: 'release', commit: '77ab3f4', by: 'github-actions', time: '2 hours ago', duration: '1m 31s',
    logs: ['[ci] Tests passed', '[docker] Image built', '[k8s] Rollout complete', '[done] Deployment successful'] },
  { id: 'DEP-1038', app: 'Order API', version: 'v1.8.9', status: 'rolled_back', branch: 'main', commit: '41d2c90', by: 'self-healing', time: '1 day ago', duration: '0m 40s',
    logs: ['[monitor] Error rate 38% after deploy', '[heal] Rollback triggered', '[k8s] kubectl rollout undo deployment/order-api', '[done] Rolled back to v1.8.8'] },
]

export const incidents = [
  { id: 'INC-304', title: 'Application down: Notification Worker', app: 'Notification Worker', severity: 'critical', status: 'open', detectedAt: '2026-11-19 09:12', resolvedAt: null, cause: 'Health check failed 5 times in a row' },
  { id: 'INC-303', title: 'High CPU utilization: Order API', app: 'Order API', severity: 'high', status: 'investigating', detectedAt: '2026-11-19 08:47', resolvedAt: null, cause: 'CPU above 85% threshold for 3 minutes' },
  { id: 'INC-302', title: 'Slow response time: Order API', app: 'Order API', severity: 'medium', status: 'investigating', detectedAt: '2026-11-19 08:40', resolvedAt: null, cause: 'Response time above 500 ms' },
  { id: 'INC-301', title: 'High memory usage: Payment Service', app: 'Payment Service', severity: 'medium', status: 'resolved', detectedAt: '2026-11-18 22:10', resolvedAt: '2026-11-18 22:13', cause: 'Memory above 80% threshold' },
  { id: 'INC-300', title: 'Failed deployment: Order API v1.8.9', app: 'Order API', severity: 'high', status: 'resolved', detectedAt: '2026-11-18 14:02', resolvedAt: '2026-11-18 14:04', cause: 'Error rate spike after deployment' },
  { id: 'INC-299', title: 'Repeated failures: Auth Service', app: 'Auth Service', severity: 'low', status: 'resolved', detectedAt: '2026-11-17 11:30', resolvedAt: '2026-11-17 11:35', cause: '3 failed health checks' },
]

export const healingActions = [
  { id: 'REC-88', incident: 'INC-304', app: 'Notification Worker', action: 'Container Restart', result: 'failed', time: '09:13', details: 'Restart attempted, container exited with code 1' },
  { id: 'REC-87', incident: 'INC-303', app: 'Order API', action: 'Autoscale', result: 'success', time: '08:49', details: 'Replicas scaled 2 → 4' },
  { id: 'REC-86', incident: 'INC-301', app: 'Payment Service', action: 'Pod Restart', result: 'success', time: 'Yesterday 22:12', details: 'Pod payment-svc-7d9f restarted' },
  { id: 'REC-85', incident: 'INC-300', app: 'Order API', action: 'Rollback', result: 'success', time: 'Yesterday 14:03', details: 'Rolled back v1.8.9 → v1.8.8' },
  { id: 'REC-84', incident: 'INC-299', app: 'Auth Service', action: 'Container Restart', result: 'success', time: '17 Nov 11:33', details: 'Container auth-svc restarted' },
]

export const activities = [
  { type: 'incident', message: 'Incident INC-304 opened for Notification Worker', time: '09:12' },
  { type: 'heal', message: 'Container restart failed for Notification Worker', time: '09:13' },
  { type: 'heal', message: 'Order API autoscaled from 2 to 4 replicas', time: '08:49' },
  { type: 'deploy', message: 'Order API v1.9.0 deployed successfully', time: '08:35' },
  { type: 'deploy', message: 'Payment Service v2.4.1 deployed successfully', time: '07:10' },
  { type: 'incident', message: 'Incident INC-301 resolved automatically', time: 'Yesterday' },
]

// Deterministic fake time-series so the charts look realistic (no randomness = same chart each reload)
export const metricSeries = Array.from({ length: 20 }, (_, i) => ({
  time: `${String(9 + Math.floor((i * 3) / 60)).padStart(2, '0')}:${String((i * 3) % 60).padStart(2, '0')}`,
  cpu: Math.round(45 + 15 * Math.sin(i / 2.2) + (i > 13 ? 22 : 0)),
  memory: Math.round(55 + 8 * Math.cos(i / 3) + i * 0.6),
  response: Math.round(130 + 40 * Math.sin(i / 1.7) + (i > 13 ? 320 : 0)),
}))

export const replicaSeries = [
  { time: '08:40', replicas: 2 }, { time: '08:45', replicas: 2 }, { time: '08:49', replicas: 4 },
  { time: '08:55', replicas: 4 }, { time: '09:05', replicas: 4 }, { time: '09:15', replicas: 4 },
]

export const k8sPods = [
  { name: 'payment-svc-7d9f4-x2k', ns: 'default', status: 'Running', restarts: 1, node: 'minikube', age: '2h' },
  { name: 'order-api-5c8b6-p9m', ns: 'default', status: 'Running', restarts: 0, node: 'minikube', age: '35m' },
  { name: 'order-api-5c8b6-q3t', ns: 'default', status: 'Running', restarts: 0, node: 'minikube', age: '5m' },
  { name: 'notify-6f7d2-k8a', ns: 'default', status: 'CrashLoopBackOff', restarts: 6, node: 'minikube', age: '3h' },
  { name: 'auth-svc-4b2a1-z7n', ns: 'default', status: 'Running', restarts: 0, node: 'minikube', age: '1d' },
]

export const k8sDeployments = [
  { name: 'payment-svc', ready: '3/3', upToDate: 3, available: 3 },
  { name: 'order-api', ready: '4/4', upToDate: 4, available: 4 },
  { name: 'notify', ready: '0/1', upToDate: 1, available: 0 },
  { name: 'auth-svc', ready: '2/2', upToDate: 2, available: 2 },
]

export const terraformResources = [
  { type: 'docker_network', name: 'resiliops_net', status: 'created' },
  { type: 'docker_image', name: 'backend_image', status: 'created' },
  { type: 'docker_container', name: 'sample_app', status: 'created' },
  { type: 'docker_container', name: 'prometheus', status: 'planned' },
  { type: 'docker_container', name: 'grafana', status: 'planned' },
]