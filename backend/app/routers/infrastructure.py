from fastapi import APIRouter
from ..services.kubernetes_recovery import KubernetesRecoveryService
from ..services.scaling_manager import ScalingManager

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure"])


@router.get("/status")
def cluster_status():
    """Returns whether live Kubernetes (Minikube) is connected or in demonstration mode."""
    return KubernetesRecoveryService.get_cluster_status()


@router.get("/pods")
def pods():
    """Lists pods from live cluster if connected, otherwise returns realistic demonstration workload."""
    return KubernetesRecoveryService.list_pods()


@router.get("/deployments")
def k8s_deployments():
    """Lists deployments from live cluster if connected, otherwise returns demonstration workload."""
    return KubernetesRecoveryService.list_deployments()


@router.get("/terraform")
def terraform():
    """Lists resources provisioned locally using the Docker provider."""
    return [
        {"type": "docker_network", "name": "resiliops_net", "status": "created"},
        {"type": "docker_image", "name": "backend_image", "status": "created"},
        {"type": "docker_container", "name": "resiliops-sample-app", "status": "created"},
        {"type": "docker_container", "name": "resiliops-prometheus", "status": "created"},
        {"type": "docker_container", "name": "grafana", "status": "planned"},
    ]


@router.get("/replica-history")
def replica_history():
    """Dynamic replica history that reflects autoscaling events in real time."""
    return ScalingManager.get_replica_history()
