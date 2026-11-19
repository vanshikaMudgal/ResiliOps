from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    url: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(20), default="unknown")  # healthy / degraded / down / unknown
    cpu: Mapped[float] = mapped_column(Float, default=0)
    memory: Mapped[float] = mapped_column(Float, default=0)
    uptime: Mapped[float] = mapped_column(Float, default=100)
    version: Mapped[str] = mapped_column(String(20), default="v1.0.0")
    replicas: Mapped[int] = mapped_column(Integer, default=1)
    monitoring: Mapped[bool] = mapped_column(default=True)
    response_ms: Mapped[int] = mapped_column(Integer, default=0)
    last_deploy_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Phase 3: Health monitoring details
    last_check_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(300), nullable=True)


class Deployment(Base):
    __tablename__ = "deployments"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g. DEP-1043
    app_id: Mapped[int] = mapped_column(ForeignKey("applications.id"))
    version: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20))  # running / success / failed / rolled_back
    branch: Mapped[str] = mapped_column(String(50), default="main")
    commit: Mapped[str] = mapped_column(String(20), default="")
    triggered_by: Mapped[str] = mapped_column(String(50), default="dashboard")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    duration: Mapped[str] = mapped_column(String(20), default="...")
    logs: Mapped[list] = mapped_column(JSON, default=list)

    app: Mapped["Application"] = relationship()


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g. INC-304
    title: Mapped[str] = mapped_column(String(200))
    app_id: Mapped[int] = mapped_column(ForeignKey("applications.id"))
    incident_type: Mapped[str] = mapped_column(String(50), default="unknown")  # downtime / cpu / memory / latency / repeated_failures
    severity: Mapped[str] = mapped_column(String(20))  # low / medium / high / critical
    status: Mapped[str] = mapped_column(String(20))  # open / investigating / resolved
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cause: Mapped[str] = mapped_column(String(300), default="")

    app: Mapped["Application"] = relationship()


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g. REC-88
    incident_id: Mapped[int | None] = mapped_column(ForeignKey("incidents.id"), nullable=True)
    app_id: Mapped[int] = mapped_column(ForeignKey("applications.id"))
    action: Mapped[str] = mapped_column(String(50))  # Container Restart / Autoscale / Rollback ...
    result: Mapped[str] = mapped_column(String(20))  # success / failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    details: Mapped[str] = mapped_column(String(300), default="")

    incident: Mapped["Incident | None"] = relationship()
    app: Mapped["Application"] = relationship()


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(20))  # incident / heal / deploy / app
    message: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class MetricPoint(Base):
    __tablename__ = "metric_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(10))  # chart x-axis label, e.g. "09:12"
    cpu: Mapped[float] = mapped_column(Float)
    memory: Mapped[float] = mapped_column(Float)
    response: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class MonitoringLog(Base):
    """Event log for monitoring events, health-check outcomes, and detected anomalies."""

    __tablename__ = "monitoring_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    level: Mapped[str] = mapped_column(String(10))  # INFO, WARN, ERROR, CRITICAL
    source: Mapped[str] = mapped_column(String(50))  # health_check, cpu_monitor, memory_monitor, incident_engine
    message: Mapped[str] = mapped_column(String(300))
    details: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class DetectionSettings(Base):
    """A single row (id=1) holding the failure-detection thresholds."""

    __tablename__ = "detection_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    cpu_threshold: Mapped[int] = mapped_column(Integer, default=80)
    memory_threshold: Mapped[int] = mapped_column(Integer, default=85)
    failure_threshold: Mapped[int] = mapped_column(Integer, default=3)
    interval_seconds: Mapped[int] = mapped_column(Integer, default=30)
    response_threshold: Mapped[int] = mapped_column(Integer, default=500)  # ms latency
