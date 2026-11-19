import asyncio
import logging
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Application, DetectionSettings, Incident, MonitoringLog
from .health_monitor import HealthMonitor
from .metrics_collector import MetricsCollector
from .failure_detector import FailureDetector
from .recovery_engine import RecoveryEngine

logger = logging.getLogger("resiliops.monitoring")


async def run_single_monitoring_cycle(db: Session) -> dict:
    """
    Executes one complete monitoring, failure detection, and self-healing pass
    across all registered apps and host metrics.
    """
    settings = db.get(DetectionSettings, 1)
    if not settings:
        settings = DetectionSettings(id=1, cpu_threshold=80, memory_threshold=85, failure_threshold=3, interval_seconds=30)
        db.add(settings)
        db.commit()

    policy = RecoveryEngine.get_policy(db)
    apps = db.scalars(select(Application).where(Application.monitoring == True)).all()  # noqa: E712

    # 1. Health check all apps in parallel using httpx
    if apps:
        async with httpx.AsyncClient() as client:
            tasks = [HealthMonitor.check_application(app, client, settings) for app in apps]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for app, res in zip(apps, results):
            if isinstance(res, Exception):
                logger.error(f"Error checking app {app.name}: {res}")
                continue
            HealthMonitor.apply_check_result(db, app, res, settings)
            FailureDetector.evaluate_application(db, app, settings)

            # 1b. Self-Healing trigger: If app is down and has a mapped container, trigger recovery
            if app.status == "down" and app.container_name and policy.allow_restart:
                can_rec, reason = RecoveryEngine.can_recover(db, app, policy)
                if can_rec:
                    # Find open incident to link
                    inc = db.scalar(
                        select(Incident).where(
                            Incident.app_id == app.id,
                            Incident.incident_type == "downtime",
                            Incident.status.in_(["open", "investigating"]),
                        )
                    )
                    logger.info(f"Triggering autonomous recovery for {app.name}: {reason}")
                    await RecoveryEngine.execute_container_restart(
                        db=db,
                        app=app,
                        incident=inc,
                        triggered_by="autonomous_recovery_engine",
                    )

    # 2. Host System Resource Evaluation (psutil)
    system_metrics = MetricsCollector.get_system_metrics()
    primary_id = apps[0].id if apps else 1
    FailureDetector.evaluate_system_resources(db, system_metrics, settings, primary_id)

    # 3. Compute average response time and record rolling MetricPoint
    active_resps = [a.response_ms for a in apps if a.status != "down" and a.response_ms > 0]
    avg_resp = (sum(active_resps) / len(active_resps)) if active_resps else 0.0
    point = MetricsCollector.record_metric_point(db, avg_resp)

    return {
        "apps_checked": len(apps),
        "host_cpu": system_metrics["cpu"]["percent"],
        "host_memory": system_metrics["memory"]["percent"],
        "avg_response_ms": round(avg_resp, 1),
        "point_label": point.label,
    }


async def background_monitoring_loop():
    """
    Continuous background loop that executes health checks, metric collections,
    and automated recovery at intervals configured in DetectionSettings.
    """
    logger.info("ResiliOps continuous monitoring & self-healing loop started.")
    while True:
        try:
            with SessionLocal() as db:
                settings = db.get(DetectionSettings, 1)
                interval = settings.interval_seconds if settings else 30
                interval = max(5, min(120, interval))

                await run_single_monitoring_cycle(db)

        except asyncio.CancelledError:
            logger.info("Monitoring loop stopping gracefully.")
            break
        except Exception as e:
            logger.exception(f"Unexpected error in monitoring/recovery cycle: {e}")
            try:
                with SessionLocal() as db:
                    db.add(
                        MonitoringLog(
                            level="ERROR",
                            source="background_runner",
                            message="Background monitoring/recovery cycle error",
                            details=str(e)[:400],
                        )
                    )
                    db.commit()
            except Exception:
                pass

        await asyncio.sleep(interval)
