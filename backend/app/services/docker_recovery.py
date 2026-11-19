import logging
import os
import docker
from docker.errors import DockerException, NotFound, APIError

logger = logging.getLogger("resiliops.docker")

# Safe whitelist of containers that ResiliOps is authorized to manage
# Prevents arbitrary container manipulation
ALLOWED_CONTAINER_PREFIXES = ("resiliops-", "sample-", "payment-svc", "auth-svc", "order-api", "notify")


def get_docker_client() -> docker.DockerClient | None:
    """
    Acquires a Docker client using the available local docker socket or DOCKER_HOST.
    Returns None if the Docker daemon is unreachable.
    """
    # 1. Try standard /var/run/docker.sock if present
    if os.path.exists("/var/run/docker.sock"):
        try:
            return docker.DockerClient(base_url="unix:///var/run/docker.sock", timeout=10)
        except Exception:
            pass

    # 2. Try default environment configuration
    try:
        return docker.from_env(timeout=10)
    except Exception as e:
        logger.debug(f"Docker from_env connection failed: {e}")
        return None


class DockerRecoveryService:
    """
    Safely interfaces with the local Docker daemon to inspect and restart containers.
    Enforces container whitelisting and non-destructive timeouts.
    """

    @staticmethod
    def get_infrastructure_status() -> dict:
        """
        Gathers genuine real-time Docker daemon status and running containers.
        """
        client = get_docker_client()
        if client is None:
            return {
                "docker_available": False,
                "message": "Docker daemon is not accessible on this system",
                "running_containers": 0,
                "total_containers": 0,
                "containers": [],
            }

        try:
            client.ping()
            containers = client.containers.list(all=True)
            active = [c for c in containers if c.status == "running"]

            container_data = []
            for c in containers:
                container_data.append({
                    "id": c.short_id,
                    "name": c.name,
                    "image": str(c.image.tags[0]) if c.image.tags else c.image.short_id,
                    "status": c.status,
                    "created": c.attrs.get("Created", ""),
                })

            return {
                "docker_available": True,
                "version": client.version().get("Version", "unknown"),
                "running_containers": len(active),
                "total_containers": len(containers),
                "containers": container_data,
            }
        except DockerException as e:
            return {
                "docker_available": False,
                "message": f"Docker API error: {str(e)[:150]}",
                "running_containers": 0,
                "total_containers": 0,
                "containers": [],
            }

    @classmethod
    def is_whitelisted(cls, container_name: str) -> bool:
        """Ensures container name is explicitly whitelisted before executing actions."""
        if not container_name:
            return False
        clean = container_name.strip().lower()
        return any(clean.startswith(prefix) for prefix in ALLOWED_CONTAINER_PREFIXES)

    @classmethod
    def restart_container(cls, container_name: str, timeout: int = 10) -> dict:
        """
        Restarts a registered Docker container.
        Validates whitelist, checks current container status, and triggers restart.
        """
        if not cls.is_whitelisted(container_name):
            return {
                "success": False,
                "error": f"Security restriction: Container '{container_name}' is not in the allowed ResiliOps whitelist",
            }

        client = get_docker_client()
        if client is None:
            return {
                "success": False,
                "error": "Docker daemon is unreachable. Verify Docker Desktop or docker service is active.",
            }

        try:
            container = client.containers.get(container_name)
            logger.info(f"Restarting container: {container_name} (ID: {container.short_id})")
            container.restart(timeout=timeout)

            # Reload container state to verify it is running
            container.reload()
            is_running = container.status == "running"

            return {
                "success": is_running,
                "status": container.status,
                "container_id": container.short_id,
                "message": f"Container '{container_name}' restarted successfully" if is_running else f"Container state is {container.status}",
            }
        except NotFound:
            return {
                "success": False,
                "error": f"Container '{container_name}' not found in Docker. Start it with docker compose first.",
            }
        except APIError as e:
            return {
                "success": False,
                "error": f"Docker API error during restart: {str(e)}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error during container restart: {str(e)}",
            }

    @classmethod
    def stop_container(cls, container_name: str) -> dict:
        """Convenience method for tests to simulate failure by stopping a container."""
        if not cls.is_whitelisted(container_name):
            return {"success": False, "error": "Not whitelisted"}
        client = get_docker_client()
        if not client:
            return {"success": False, "error": "Docker unavailable"}
        try:
            c = client.containers.get(container_name)
            c.stop(timeout=5)
            return {"success": True, "message": f"Container '{container_name}' stopped"}
        except Exception as e:
            return {"success": False, "error": str(e)}

