import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, DetectionSettings, Incident, MetricPoint, MonitoringLog
from ..serializers import app_out, log_out, metric_out
from ..services.background_runner import run_single_monitoring_cycle
from ..services.metrics_collector import MetricsCollector
from ..services.prometheus_exporter import export_metrics

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])

# Demo simulation state for mock test endpoint
demo_target_state = {
    "status": "healthy",  # "healthy", "failing", "slow"
    "status_code": 200,
    "latency_ms": 25,
}


@router.get("/overview")
def monitoring_overview(db: Session = Depends(get_db)):
    """
    Overview summary of current system health, monitored applications,
    host resource utilization, and active incidents.
    """
    apps = db.scalars(select(Application)).all()
    total_apps = len(apps)
    monitored_apps = [a for a in apps if a.monitoring]
    healthy_apps = [a for a in apps if a.status == "healthy"]
    degraded_apps = [a for a in apps if a.status == "degraded"]
    down_apps = [a for a in apps if a.status == "down"]

    # Health score calculation
    score = round((len(healthy_apps) / total_apps * 100)) if total_apps > 0 else 100

    active_incidents = db.scalar(
        select(func.count(Incident.id)).where(Incident.status.in_(["open", "investigating"]))
    ) or 0

    system_metrics = MetricsCollector.get_system_metrics()
    process_metrics = MetricsCollector.get_process_metrics()

    return {
        "system_health_score": score,
        "total_applications": total_apps,
        "monitored_applications": len(monitored_apps),
        "healthy_applications": len(healthy_apps),
        "degraded_applications": len(degraded_apps),
        "down_applications": len(down_apps),
        "active_incidents": active_incidents,
        "host_cpu_percent": system_metrics["cpu"]["percent"],
        "host_memory_percent": system_metrics["memory"]["percent"],
        "host_memory_total_gb": system_metrics["memory"]["total_gb"],
        "host_memory_used_gb": system_metrics["memory"]["used_gb"],
        "host_memory_available_mb": system_metrics["memory"]["available_mb"],
        "backend_process": process_metrics,
    }


@router.get("/metrics")
def get_monitoring_metrics(db: Session = Depends(get_db)):
    """Returns the time-series points for the CPU, memory, and response-time charts."""
    rows = db.scalars(select(MetricPoint).order_by(MetricPoint.id.asc())).all()
    return [metric_out(m) for m in rows]


@router.get("/history")
def get_monitoring_history(limit: int = 30, db: Session = Depends(get_db)):
    """Returns historical metric points with configurable limit."""
    rows = db.scalars(select(MetricPoint).order_by(MetricPoint.id.desc()).limit(limit)).all()
    return [metric_out(m) for m in reversed(rows)]


@router.get("/system")
def get_system_metrics():
    """Provides comprehensive real host and process metrics via psutil."""
    return {
        "system": MetricsCollector.get_system_metrics(),
        "process": MetricsCollector.get_process_metrics(),
    }


@router.get("/applications")
def get_monitoring_applications(db: Session = Depends(get_db)):
    """Returns all applications with their detailed health-check status and metrics."""
    apps = db.scalars(select(Application).order_by(Application.id.asc())).all()
    return [app_out(a) for a in apps]


@router.get("/applications/{app_id}")
def get_monitoring_application(app_id: int, db: Session = Depends(get_db)):
    """Returns detailed monitoring data for a specific application."""
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_out(app)


@router.get("/logs")
def get_monitoring_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Returns the most recent monitoring and failure-detection audit logs."""
    rows = db.scalars(select(MonitoringLog).order_by(MonitoringLog.id.desc()).limit(limit)).all()
    return [log_out(l) for l in rows]


@router.post("/check-now")
async def trigger_immediate_check(db: Session = Depends(get_db)):
    """Triggers an on-demand health-check and failure detection cycle immediately."""
    result = await run_single_monitoring_cycle(db)
    return {"message": "Monitoring cycle completed successfully", "details": result}


# Demonstration & Testing Endpoints for Internal Examination

class CpuLoadRequest(BaseModel):
    duration_seconds: int = 4


@router.post("/simulate/cpu-load")
def simulate_cpu_load(body: CpuLoadRequest):
    """
    Generates a controlled, safe CPU load for demonstration of high CPU detection.
    Runs for the specified duration (max 8 seconds to prevent resource exhaustion).
    """
    duration = max(1, min(8, body.duration_seconds))
    end_time = time.time() + duration

    # Simple busy loop in a background thread to generate safe CPU activity
    while time.time() < end_time:
        _ = [x * x for x in range(10000)]

    return {"message": f"Generated controlled CPU load for {duration} seconds"}


class DemoStateRequest(BaseModel):
    state: str  # "healthy", "failing", "slow"


@router.post("/simulate/test-app-state")
def set_test_app_state(body: DemoStateRequest):
    """
    Controls the behavior of the built-in test endpoint (/api/test/sample-app/health).
    Allows students to easily demonstrate healthy -> failure -> recovery in real time.
    """
    if body.state == "healthy":
        demo_target_state.update({"status": "healthy", "status_code": 200, "latency_ms": 15})
    elif body.state == "failing":
        demo_target_state.update({"status": "failing", "status_code": 500, "latency_ms": 30})
    elif body.state == "slow":
        demo_target_state.update({"status": "slow", "status_code": 200, "latency_ms": 750})
    else:
        raise HTTPException(status_code=400, detail="Invalid state: choose 'healthy', 'failing', or 'slow'")

    return {"message": f"Test target app state set to: {body.state}", "current_state": demo_target_state}


@router.get("/simulate/test-app-state")
def get_test_app_state():
    """Returns the current state of the demo target application."""
    return demo_target_state
