from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Activity, Incident, MonitoringLog
from .prometheus_exporter import INCIDENTS_TOTAL


class IncidentManager:
    """
    Manages automated incident generation, deduplication, resolution, and activity logging.
    """

    @staticmethod
    def get_next_code(db: Session) -> str:
        """Computes the next INC-xxx identifier based on highest existing ID."""
        last_code = db.scalar(select(Incident.code).order_by(Incident.id.desc()))
        if last_code and last_code.startswith("INC-"):
            try:
                num = int(last_code.split("-")[1]) + 1
                return f"INC-{num}"
            except ValueError:
                pass
        count = db.scalar(select(Incident.id).order_by(Incident.id.desc())) or 300
        return f"INC-{count + 1}"

    @staticmethod
    def has_active_incident(db: Session, app_id: int, incident_type: str) -> bool:
        """
        Deduplication check: returns True if an active incident (open or investigating)
        already exists for this app and failure type to prevent duplicate incident spam.
        """
        existing = db.scalar(
            select(Incident).where(
                Incident.app_id == app_id,
                Incident.incident_type == incident_type,
                Incident.status.in_(["open", "investigating"]),
            )
        )
        return existing is not None

    @classmethod
    def create_incident(
        cls,
        db: Session,
        app_id: int,
        title: str,
        incident_type: str,
        severity: str,
        cause: str,
    ) -> Incident | None:
        """
        Generates an incident automatically if one is not already actively open for the same issue.
        """
        # Deduplication check
        if cls.has_active_incident(db, app_id, incident_type):
            return None

        code = cls.get_next_code(db)
        now = datetime.now()

        incident = Incident(
            code=code,
            title=title,
            app_id=app_id,
            incident_type=incident_type,
            severity=severity.lower(),
            status="open",
            detected_at=now,
            resolved_at=None,
            cause=cause,
        )
        db.add(incident)
        db.flush()

        app_name = incident.app.name if incident.app else "System"

        # Record system activity
        activity_msg = f"Incident {code} opened: {title} ({severity.upper()})"
        db.add(Activity(type="incident", message=activity_msg, created_at=now))

        # Record monitoring audit log
        log_level = "CRITICAL" if severity.lower() == "critical" else "ERROR"
        db.add(
            MonitoringLog(
                level=log_level,
                source="failure_detector",
                message=f"[{code}] {title}",
                details=f"App: {app_name} | Type: {incident_type} | Cause: {cause}",
                created_at=now,
            )
        )

        # Update Prometheus counter
        INCIDENTS_TOTAL.labels(severity=severity.lower(), type=incident_type).inc()

        db.commit()
        db.refresh(incident)
        return incident

    @classmethod
    def resolve_incident_for_app(
        cls, db: Session, app_id: int, incident_type: str, reason: str = "Recovered automatically"
    ) -> Incident | None:
        """
        Resolves an active incident when the application or system metrics recover to normal.
        """
        incident = db.scalar(
            select(Incident).where(
                Incident.app_id == app_id,
                Incident.incident_type == incident_type,
                Incident.status.in_(["open", "investigating"]),
            )
        )
        if not incident:
            return None

        incident.status = "resolved"
        incident.resolved_at = datetime.now()
        app_name = incident.app.name if incident.app else "System"

        msg = f"Incident {incident.code} resolved automatically for {app_name}"
        db.add(Activity(type="incident", message=msg, created_at=datetime.now()))
        db.add(
            MonitoringLog(
                level="INFO",
                source="incident_manager",
                message=msg,
                details=f"Reason: {reason}",
                created_at=datetime.now(),
            )
        )
        db.commit()
        db.refresh(incident)
        return incident

