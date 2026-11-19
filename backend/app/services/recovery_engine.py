from datetime import datetime, timedelta
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Activity, Application, Incident, MonitoringLog, RecoveryAction, RecoveryPolicy
from .docker_recovery import DockerRecoveryService
from .kubernetes_recovery import KubernetesRecoveryService
from .recovery_verifier import RecoveryVerifier

logger = logging.getLogger("resiliops.recovery")


class RecoveryEngine:
    """
    Central Autonomous Self-Healing and Recovery Engine.
    Coordinates policy checks, Docker container remediation, Kubernetes pod recovery,
    automated rollbacks, and autoscaling.
    """

    @staticmethod
    def get_policy(db: Session) -> RecoveryPolicy:
        """Retrieves or initializes the singleton RecoveryPolicy."""
        policy = db.get(RecoveryPolicy, 1)
        if not policy:
            policy = RecoveryPolicy(
                id=1,
                auto_recovery_enabled=True,
                allow_restart=True,
                allow_rollback=True,
                allow_scaling=True,
                max_attempts=3,
                cooldown_seconds=60,
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def get_next_code(db: Session) -> str:
        """Generates the next REC-xxx identifier."""
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
    def can_recover(
        cls, db: Session, app: Application, policy: RecoveryPolicy
    ) -> tuple[bool, str]:
        """
        Policy enforcement: Checks whether an application is eligible for recovery,
        verifying master switch, per-app switch, cooldown period, and retry limits.
        """
        if not policy.auto_recovery_enabled:
            return False, "Autonomous self-healing is disabled globally in Recovery Policies"

        if not getattr(app, "recovery_enabled", True):
            return False, f"Recovery is disabled for application '{app.name}'"

        # Check recent recovery actions for cooldown & retry limits
        recent_actions = db.scalars(
            select(RecoveryAction)
            .where(RecoveryAction.app_id == app.id)
            .order_by(RecoveryAction.created_at.desc())
            .limit(5)
        ).all()

        if recent_actions:
            last_action = recent_actions[0]
            cooldown_cutoff = datetime.now() - timedelta(seconds=policy.cooldown_seconds)
            if last_action.created_at > cooldown_cutoff:
                # Count recent consecutive failures in current cooldown window
                recent_fails = sum(1 for a in recent_actions if a.result == "failed")
                if recent_fails >= policy.max_attempts:
                    return False, f"Max recovery retry limit ({policy.max_attempts}) reached. Halting automatic retries."

                elapsed = int((datetime.now() - last_action.created_at).total_seconds())
                remaining = policy.cooldown_seconds - elapsed
                return False, f"Cooldown active for '{app.name}': please wait {remaining}s before next recovery"

        return True, "Eligible"

    @classmethod
    async def execute_container_restart(
        cls,
        db: Session,
        app: Application,
        incident: Incident | None = None,
        triggered_by: str = "automated_engine",
    ) -> RecoveryAction:
        """
        Executes a safe Docker container restart, independently verifies health,
        and records the operation status in the database.
        """
        rec_code = cls.get_next_code(db)
        now = datetime.now()
        target_name = app.container_name or f"resiliops-{app.name.lower().replace(' ', '-')}"

        # 1. Create Pending Recovery Record
        rec_action = RecoveryAction(
            code=rec_code,
            incident_id=incident.id if incident else None,
            app_id=app.id,
            action="Container Restart",
            result="failed",  # Default until verification succeeds
            target=target_name,
            execution_status="RUNNING",
            started_at=now,
            created_at=now,
            attempts=1,
            details=f"Restarting Docker container '{target_name}' triggered by {triggered_by}",
        )
        db.add(rec_action)
        db.commit()
        db.refresh(rec_action)

        logger.info(f"[{rec_code}] Executing Container Restart for {app.name} ({target_name})")

        # 2. Invoke Docker Service
        restart_res = DockerRecoveryService.restart_container(target_name, timeout=10)

        if not restart_res["success"]:
            rec_action.execution_status = "FAILED"
            rec_action.result = "failed"
            rec_action.completed_at = datetime.now()
            rec_action.error_message = restart_res.get("error", "Docker restart failed")
            rec_action.details = f"Restart failed: {rec_action.error_message}"

            db.add(
                MonitoringLog(
                    level="ERROR",
                    source="recovery_engine",
                    message=f"[{rec_code}] Container restart failed for {app.name}",
                    details=rec_action.error_message,
                    created_at=datetime.now(),
                )
            )
            db.commit()
            return rec_action

        # 3. Independent Post-Restart Verification
        verify_res = await RecoveryVerifier.verify_application_health(
            url=app.url,
            max_wait_seconds=12.0,
            probe_interval=1.5,
        )

        rec_action.completed_at = datetime.now()

        if verify_res["is_healthy"]:
            # Successful Recovery
            rec_action.execution_status = "SUCCESS"
            rec_action.result = "success"
            rec_action.error_message = None
            rec_action.details = (
                f"Container '{target_name}' restarted and verified healthy "
                f"(HTTP {verify_res['status_code']} in {verify_res['latency_ms']}ms)"
            )

            # Update Application state
            app.status = "healthy"
            app.consecutive_failures = 0
            app.response_ms = verify_res["latency_ms"]
            app.last_success_at = datetime.now()
            app.status_code = verify_res["status_code"]

            # Update Incident state if linked
            if incident:
                incident.status = "resolved"
                incident.resolved_at = datetime.now()

            # Record system activity & audit log
            act_msg = f"Application '{app.name}' recovered successfully via Container Restart ({rec_code})"
            db.add(Activity(type="heal", message=act_msg, created_at=datetime.now()))
            db.add(
                MonitoringLog(
                    level="INFO",
                    source="recovery_engine",
                    message=act_msg,
                    details=rec_action.details,
                    created_at=datetime.now(),
                )
            )
        else:
            # Container restarted but application failed health check
            rec_action.execution_status = "FAILED"
            rec_action.result = "failed"
            rec_action.error_message = verify_res["message"]
            rec_action.details = f"Container restarted but application remained unreachable: {verify_res['message']}"

            db.add(
                MonitoringLog(
                    level="ERROR",
                    source="recovery_engine",
                    message=f"[{rec_code}] Post-restart health verification failed for {app.name}",
                    details=verify_res["message"],
                    created_at=datetime.now(),
                )
            )

        db.commit()
        db.refresh(rec_action)
        return rec_action

    @classmethod
    def execute_pod_recovery(
        cls,
        db: Session,
        app: Application,
        pod_name: str,
        incident: Incident | None = None,
        triggered_by: str = "operator_manual",
    ) -> RecoveryAction:
        """
        Recreates an unhealthy Kubernetes pod by deleting it so Deployment controller spins up a replacement.
        """
        rec_code = cls.get_next_code(db)
        now = datetime.now()

        rec_action = RecoveryAction(
            code=rec_code,
            incident_id=incident.id if incident else None,
            app_id=app.id,
            action="Pod Restart",
            result="success",
            target=pod_name,
            execution_status="SUCCESS",
            started_at=now,
            completed_at=now,
            attempts=1,
            details=f"Pod '{pod_name}' deleted; Deployment controller recreating replica ({triggered_by})",
            created_at=now,
        )
        db.add(rec_action)

        k8s_res = KubernetesRecoveryService.recreate_pod(pod_name)
        if k8s_res.get("mode") == "demonstration":
            rec_action.details += " [Simulated K8s Demo]"

        if incident:
            incident.status = "resolved"
            incident.resolved_at = now

        act_msg = f"Pod '{pod_name}' recreated for {app.name} ({rec_code})"
        db.add(Activity(type="heal", message=act_msg, created_at=now))
        db.add(
            MonitoringLog(
                level="INFO",
                source="recovery_engine",
                message=act_msg,
                details=rec_action.details,
                created_at=now,
            )
        )
        db.commit()
        db.refresh(rec_action)
        return rec_action
