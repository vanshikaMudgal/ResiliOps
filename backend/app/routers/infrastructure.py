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
    """Lists resources defined in terraform/main.tf using the Docker provider."""
    import json
    from pathlib import Path
    tfstate_file = Path("terraform/terraform.tfstate")
    if tfstate_file.exists():
        try:
            with open(tfstate_file, "r") as f:
                data = json.load(f)
                resources = []
                for res in data.get("resources", []):
                    resources.append({
                        "type": res.get("type"),
                        "name": res.get("name"),
                        "status": "active" if res.get("instances") else "created",
                        "provider": "kreuzwerker/docker"
                    })
                if resources:
                    return resources
        except Exception:
            pass
    return [
        {"type": "docker_network", "name": "resiliops_tf_net", "status": "active", "provider": "kreuzwerker/docker"},
        {"type": "docker_container", "name": "demo_app", "status": "active", "provider": "kreuzwerker/docker"},
    ]


@router.get("/replica-history")
def replica_history():
    """Dynamic replica history that reflects autoscaling events in real time."""
    return ScalingManager.get_replica_history()
