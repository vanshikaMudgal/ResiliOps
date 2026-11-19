from sqlalchemy.orm import Session

from ..models import Application, DetectionSettings
from .incident_manager import IncidentManager


class FailureDetector:
    """
    Modular Failure Detection Engine.
    Inspects health check metrics, host metrics, and latency against configured thresholds.
    Triggers automated incidents with proper deduplication and severity levels.
    """

    @classmethod
    def evaluate_application(
        cls, db: Session, app: Application, settings: DetectionSettings
    ) -> list[str]:
        """
        Inspects an application's health status and response metrics.
        Returns a list of anomaly descriptions identified.
        """
        anomalies = []
        failure_threshold = settings.failure_threshold if settings else 3
        response_threshold = getattr(settings, "response_threshold", 500)

        # 1. Repeated health-check failures and downtime
        if app.consecutive_failures >= failure_threshold:
            anomaly = f"Application down: {app.name} failed {app.consecutive_failures} consecutive health checks"
            anomalies.append(anomaly)
            IncidentManager.create_incident(
                db=db,
                app_id=app.id,
                title=f"Application down: {app.name}",
                incident_type="downtime",
                severity="critical",
                cause=f"Health check failed {app.consecutive_failures} consecutive times ({app.error_message or 'Unreachable'})",
            )
        elif app.consecutive_failures == 0:
            # If application recovered to 0 failures, auto-resolve any active downtime incidents
            IncidentManager.resolve_incident_for_app(
                db=db,
                app_id=app.id,
                incident_type="downtime",
                reason=f"Application {app.name} passed health check with HTTP {app.status_code}",
            )

        # 2. Excessive response latency
        if app.status != "down" and app.response_ms > response_threshold:
            anomaly = f"High latency: {app.name} response time is {app.response_ms}ms (threshold: {response_threshold}ms)"
            anomalies.append(anomaly)
            IncidentManager.create_incident(
                db=db,
                app_id=app.id,
                title=f"Slow response time: {app.name}",
                incident_type="latency",
                severity="medium",
                cause=f"Response time of {app.response_ms}ms exceeds threshold of {response_threshold}ms",
            )
        elif app.status != "down" and app.response_ms <= response_threshold and app.response_ms > 0:
            IncidentManager.resolve_incident_for_app(
                db=db,
                app_id=app.id,
                incident_type="latency",
                reason=f"Response time dropped to normal ({app.response_ms}ms)",
            )

        return anomalies

    @classmethod
    def evaluate_system_resources(
        cls,
        db: Session,
        system_metrics: dict,
        settings: DetectionSettings,
        primary_app_id: int | None = None,
    ) -> list[str]:
        """
        Evaluates host CPU and Memory utilization against configured thresholds.
        """
        anomalies = []
        cpu_val = system_metrics["cpu"]["percent"]
        mem_val = system_metrics["memory"]["percent"]

        # If primary_app_id is not given, associate with app_id=1 for relational integrity
        target_app_id = primary_app_id or 1

        # 3. High CPU Utilization
        if cpu_val >= settings.cpu_threshold:
            msg = f"Host CPU utilization reached {cpu_val}% (threshold: {settings.cpu_threshold}%)"
            anomalies.append(msg)
            IncidentManager.create_incident(
                db=db,
                app_id=target_app_id,
                title=f"High CPU utilization: {cpu_val}%",
                incident_type="high_cpu",
                severity="high",
                cause=f"Host CPU usage {cpu_val}% exceeded threshold of {settings.cpu_threshold}%",
            )
        elif cpu_val < settings.cpu_threshold - 5:  # Hysteresis margin
            IncidentManager.resolve_incident_for_app(
                db=db,
                app_id=target_app_id,
                incident_type="high_cpu",
                reason=f"Host CPU normalized to {cpu_val}%",
            )

        # 4. High Memory Utilization
        if mem_val >= settings.memory_threshold:
            msg = f"Host Memory utilization reached {mem_val}% (threshold: {settings.memory_threshold}%)"
            anomalies.append(msg)
            IncidentManager.create_incident(
                db=db,
                app_id=target_app_id,
                title=f"High memory utilization: {mem_val}%",
                incident_type="high_memory",
                severity="high",
                cause=f"Host RAM usage {mem_val}% exceeded threshold of {settings.memory_threshold}% ({system_metrics['memory']['used_mb']} MB used)",
            )
        elif mem_val < settings.memory_threshold - 5:
            IncidentManager.resolve_incident_for_app(
                db=db,
                app_id=target_app_id,
                incident_type="high_memory",
                reason=f"Host RAM normalized to {mem_val}%",
            )

        return anomalies

