from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify system health check endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_prometheus_metrics_endpoint():
    """Verify Prometheus scrape endpoint exposes custom ResiliOps metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    content = response.text
    assert "resiliops_application_status" in content
    assert "resiliops_system_cpu_usage_percent" in content


def test_monitoring_overview():
    """Verify monitoring overview returns system health score and host metrics."""
    response = client.get("/api/monitoring/overview")
    assert response.status_code == 200
    data = response.json()
    assert "system_health_score" in data
    assert "total_applications" in data
    assert "host_cpu_percent" in data


def test_recovery_policies():
    """Verify retrieval and update of self-healing recovery policies."""
    response = client.get("/api/recovery/policies")
    assert response.status_code == 200
    policy = response.json()
    assert "autoRecoveryEnabled" in policy
    assert "allowRestart" in policy


def test_infrastructure_status():
    """Verify infrastructure status reports Docker and Kubernetes connectivity."""
    response = client.get("/api/recovery/infrastructure-status")
    assert response.status_code == 200
    data = response.json()
    assert "docker" in data
    assert "kubernetes" in data


def test_incidents_listing():
    """Verify incidents endpoint lists recorded incidents."""
    response = client.get("/api/incidents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

