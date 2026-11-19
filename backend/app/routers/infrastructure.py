from fastapi import APIRouter

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure"])

# SIMULATED: replaced with real `kubectl` / `terraform` data in Phases 4-5.


@router.get("/pods")
def pods():
    return [
        {"name": "payment-svc-7d9f4-x2k", "ns": "default", "status": "Running", "restarts": 1, "node": "minikube", "age": "2h"},
        {"name": "order-api-5c8b6-p9m", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "35m"},
        {"name": "order-api-5c8b6-q3t", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "5m"},
        {"name": "notify-6f7d2-k8a", "ns": "default", "status": "CrashLoopBackOff", "restarts": 6, "node": "minikube", "age": "3h"},
        {"name": "auth-svc-4b2a1-z7n", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "1d"},
    ]


@router.get("/deployments")
def k8s_deployments():
    return [
        {"name": "payment-svc", "ready": "3/3", "upToDate": 3, "available": 3},
        {"name": "order-api", "ready": "4/4", "upToDate": 4, "available": 4},
        {"name": "notify", "ready": "0/1", "upToDate": 1, "available": 0},
        {"name": "auth-svc", "ready": "2/2", "upToDate": 2, "available": 2},
    ]


@router.get("/terraform")
def terraform():
    return [
        {"type": "docker_network", "name": "resiliops_net", "status": "created"},
        {"type": "docker_image", "name": "backend_image", "status": "created"},
        {"type": "docker_container", "name": "sample_app", "status": "created"},
        {"type": "docker_container", "name": "prometheus", "status": "planned"},
        {"type": "docker_container", "name": "grafana", "status": "planned"},
    ]


@router.get("/replica-history")
def replica_history():
    return [
        {"time": "08:40", "replicas": 2}, {"time": "08:45", "replicas": 2}, {"time": "08:49", "replicas": 4},
        {"time": "08:55", "replicas": 4}, {"time": "09:05", "replicas": 4}, {"time": "09:15", "replicas": 4},
    ]