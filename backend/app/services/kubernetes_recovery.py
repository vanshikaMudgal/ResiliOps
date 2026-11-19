import logging
import os
from datetime import datetime

logger = logging.getLogger("resiliops.k8s")

try:
    from kubernetes import client, config
    from kubernetes.client.rest import ApiException
    HAS_K8S_LIB = True
except ImportError:
    HAS_K8S_LIB = False


def get_k8s_api():
    """
    Attempts to initialize Kubernetes client from standard local kubeconfig (~/.kube/config)
    or in-cluster configuration. Returns (CoreV1Api, AppsV1Api) or (None, None).
    """
    if not HAS_K8S_LIB:
        return None, None

    try:
        # 1. Try local ~/.kube/config
        config.load_kube_config()
        return client.CoreV1Api(), client.AppsV1Api()
    except Exception:
        pass

    try:
        # 2. Try in-cluster service account config
        config.load_incluster_config()
        return client.CoreV1Api(), client.AppsV1Api()
    except Exception:
        return None, None


class KubernetesRecoveryService:
    """
    Safe Kubernetes integration supporting Minikube and local clusters.
    Manages pod recreation, deployment scaling, and rollout undo.
    Clearly distinguishes live cluster state from fallback/offline mode.
    """

    @staticmethod
    def get_cluster_status() -> dict:
        """Checks if a local Kubernetes cluster (Minikube) is currently accessible."""
        core_api, _ = get_k8s_api()
        if core_api is None:
            return {
                "available": False,
                "message": "Kubernetes cluster (Minikube) is not reachable at ~/.kube/config. Start it with 'minikube start'.",
            }
        try:
            # Quick ping by reading namespace
            core_api.get_api_resources()
            return {
                "available": True,
                "message": "Connected to Kubernetes cluster (Minikube)",
            }
        except Exception as e:
            return {
                "available": False,
                "message": f"Kubernetes connection error: {str(e)[:100]}",
            }

    @staticmethod
    def list_pods(namespace: str = "default") -> list[dict]:
        """Lists pods from live cluster if available, otherwise returns realistic sample data."""
        core_api, _ = get_k8s_api()
        if core_api:
            try:
                pods_list = core_api.list_namespaced_pod(namespace=namespace, timeout_seconds=4)
                results = []
                for p in pods_list.items:
                    restarts = 0
                    if p.status.container_statuses:
                        restarts = sum(cs.restart_count for cs in p.status.container_statuses)

                    results.append({
                        "name": p.metadata.name,
                        "ns": p.metadata.namespace,
                        "status": p.status.phase,
                        "restarts": restarts,
                        "node": p.spec.node_name or "minikube",
                        "age": "Active",
                        "is_live": True,
                    })
                if results:
                    return results
            except Exception as e:
                logger.debug(f"K8s list_pods exception: {e}")

        # Fallback sample pods for demonstration when Minikube is stopped
        return [
            {"name": "payment-svc-7d9f4-x2k", "ns": "default", "status": "Running", "restarts": 1, "node": "minikube", "age": "2h", "is_live": False},
            {"name": "order-api-5c8b6-p9m", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "35m", "is_live": False},
            {"name": "order-api-5c8b6-q3t", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "5m", "is_live": False},
            {"name": "notify-6f7d2-k8a", "ns": "default", "status": "CrashLoopBackOff", "restarts": 6, "node": "minikube", "age": "3h", "is_live": False},
            {"name": "auth-svc-4b2a1-z7n", "ns": "default", "status": "Running", "restarts": 0, "node": "minikube", "age": "1d", "is_live": False},
        ]

    @staticmethod
    def list_deployments(namespace: str = "default") -> list[dict]:
        """Lists deployments from live cluster if available, otherwise returns fallback data."""
        _, apps_api = get_k8s_api()
        if apps_api:
            try:
                deps = apps_api.list_namespaced_deployment(namespace=namespace, timeout_seconds=4)
                results = []
                for d in deps.items:
                    ready = d.status.ready_replicas or 0
                    total = d.spec.replicas or 0
                    results.append({
                        "name": d.metadata.name,
                        "ready": f"{ready}/{total}",
                        "upToDate": d.status.updated_replicas or 0,
                        "available": d.status.available_replicas or 0,
                        "is_live": True,
                    })
                if results:
                    return results
            except Exception as e:
                logger.debug(f"K8s list_deployments exception: {e}")

        return [
            {"name": "payment-svc", "ready": "3/3", "upToDate": 3, "available": 3, "is_live": False},
            {"name": "order-api", "ready": "4/4", "upToDate": 4, "available": 4, "is_live": False},
            {"name": "notify", "ready": "0/1", "upToDate": 1, "available": 0, "is_live": False},
            {"name": "auth-svc", "ready": "2/2", "upToDate": 2, "available": 2, "is_live": False},
        ]

    @classmethod
    def recreate_pod(cls, pod_name: str, namespace: str = "default") -> dict:
        """
        Deletes a pod so that its parent Deployment controller automatically recreates it.
        """
        core_api, _ = get_k8s_api()
        if not core_api:
            # Simulated demonstration mode when cluster is offline
            return {
                "success": True,
                "mode": "demonstration",
                "pod_name": pod_name,
                "message": f"[DEMO] Pod '{pod_name}' deleted; Deployment controller recreation simulated",
            }

        try:
            core_api.delete_namespaced_pod(name=pod_name, namespace=namespace)
            return {
                "success": True,
                "mode": "live_k8s",
                "pod_name": pod_name,
                "message": f"Pod '{pod_name}' deleted in namespace '{namespace}'. Deployment controller recreating replica.",
            }
        except ApiException as e:
            return {"success": False, "error": f"Kubernetes API error: {e.reason}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def scale_deployment(cls, deployment_name: str, replicas: int, namespace: str = "default") -> dict:
        """
        Scales a Kubernetes deployment's replica count.
        """
        _, apps_api = get_k8s_api()
        if not apps_api:
            return {
                "success": True,
                "mode": "demonstration",
                "deployment": deployment_name,
                "replicas": replicas,
                "message": f"[DEMO] Scaled deployment '{deployment_name}' to {replicas} replicas",
            }

        try:
            body = {"spec": {"replicas": replicas}}
            apps_api.patch_namespaced_deployment_scale(name=deployment_name, namespace=namespace, body=body)
            return {
                "success": True,
                "mode": "live_k8s",
                "deployment": deployment_name,
                "replicas": replicas,
                "message": f"Scaled live deployment '{deployment_name}' to {replicas} replicas",
            }
        except ApiException as e:
            return {"success": False, "error": f"K8s scale error: {e.reason}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def rollback_deployment(cls, deployment_name: str, namespace: str = "default") -> dict:
        """
        Performs a rollout undo on a Kubernetes deployment.
        """
        status = cls.get_cluster_status()
        if not status["available"]:
            return {
                "success": True,
                "mode": "demonstration",
                "deployment": deployment_name,
                "message": f"[DEMO] Rolled back deployment '{deployment_name}' to previous revision",
            }

        import subprocess
        try:
            res = subprocess.run(
                ["kubectl", "rollout", "undo", f"deployment/{deployment_name}", "-n", namespace],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if res.returncode == 0:
                return {"success": True, "mode": "live_k8s", "message": res.stdout.strip()}
            else:
                return {"success": False, "error": res.stderr.strip()}
        except Exception as e:
            return {"success": False, "error": str(e)}

