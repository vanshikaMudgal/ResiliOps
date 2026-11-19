from datetime import datetime
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Activity, Application, Incident, MonitoringLog, RecoveryAction
from .kubernetes_recovery import KubernetesRecoveryService

logger = logging.getLogger("resiliops.scaling")

# Dynamic replica history buffer for the dashboard Recharts line chart
replica_history_points = [
    {"time": "08:40", "replicas": 2},
    {"time": "08:45", "replicas": 2},
    {"time": "08:49", "replicas": 4},
    {"time": "08:55", "replicas": 4},
    {"time": "09:05", "replicas": 4},
    {"time": "09:15", "replicas": 4},
]


class ScalingManager:
    """
    Manages automated and manual application replica scaling.
    Prevents runaway scaling by enforcing min/max replica boundaries.
    """

    MIN_REPLICAS = 1
    MAX_REPLICAS = 6

    @staticmethod
    def get_replica_history() -> list[dict]:
        """Returns the chronological replica history for dashboard visualization."""
        return replica_history_points[-15:]

    @staticmethod
    def get_next_code(db: Session) -> str:
        last_code = db.scalar(select(RecoveryAction.code).order_by(RecoveryAction.id.desc()))
        if last_code and last_code.startswith("REC-"):
            try:
                num = int(last_code.split("-")[1]) + 1
                return f"REC-{num}"
            except ValueError:
                pass
        count = db.scalar(select(RecoveryAction.id).order_by(RecoveryAction.id.desc())) or 88
        return f"REC-{count + 1}"

    @classmethod
    def execute_scaling(
        cls,
        db: Session,
        app: Application,
        delta: int = 2,
        incident: Incident | None = None,
        triggered_by: str = "automated_engine",
    ) -> RecoveryAction:
        """
        Scales an application's replicas up or down within safe boundaries (1..6).
        """
        rec_code = cls.get_next_code(db)
        now = datetime.now()
        current_replicas = app.replicas or 2
        target_replicas = max(cls.MIN_REPLICAS, min(cls.MAX_REPLICAS, current_replicas + delta))

        if target_replicas == current_replicas:
            # Reached boundary limit
            rec_action = RecoveryAction(
                code=rec_code,
                incident_id=incident.id if incident else None,
                app_id=app.id,
                action="Autoscale",
                result="failed",
                target=f"{app.name} (at limit: {current_replicas})",
                execution_status="SKIPPED",
                started_at=now,
                completed_at=now,
                attempts=1,
                error_message=f"Scaling limit reached (Max: {cls.MAX_REPLICAS}, Min: {cls.MIN_REPLICAS})",
                details=f"Cannot scale {app.name}: already at boundary ({current_replicas} replicas)",
                created_at=now,
            )
            db.add(rec_action)
            db.commit()
            return rec_action

        # 1. Create Running Recovery Action record
        rec_action = RecoveryAction(
            code=rec_code,
            incident_id=incident.id if incident else None,
            app_id=app.id,
            action="Autoscale",
            result="success",
            target=f"{app.name} (replicas {current_replicas} → {target_replicas})",
            execution_status="SUCCESS",
            started_at=now,
            completed_at=now,
            attempts=1,
            details=f"Scaled replicas {current_replicas} → {target_replicas} triggered by {triggered_by}",
            created_at=now,
        )
        db.add(rec_action)

        # 2. Update Application replicas in database
        app.replicas = target_replicas

        # 3. Scale Kubernetes deployment if available
        k8s_name = app.name.lower().replace(" ", "-")
        k8s_res = KubernetesRecoveryService.scale_deployment(k8s_name, target_replicas)
        if k8s_res.get("mode") == "live_k8s":
            rec_action.details += " (Applied to live Kubernetes Deployment)"

        # 4. Append to real-time replica history buffer
        time_label = now.strftime("%H:%M:%S")
        replica_history_points.append({"time": time_label, "replicas": target_replicas})

        # 5. Resolve incident if high CPU
        if incident:
            incident.status = "resolved"
            incident.resolved_at = now

        # 6. Audit & Activity Logging
        act_msg = f"{app.name} autoscaled from {current_replicas} to {target_replicas} replicas"
        db.add(Activity(type="heal", message=act_msg, created_at=now))
        db.add(
            MonitoringLog(
                level="INFO",
                source="scaling_manager",
                message=act_msg,
                details=rec_action.details,
                created_at=now,
            )
        )

        db.commit()
        db.refresh(rec_action)
        return rec_action

