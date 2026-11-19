from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, Incident, RecoveryAction, RecoveryPolicy
from ..serializers import policy_out, recovery_out
from ..services.docker_recovery import DockerRecoveryService
from ..services.kubernetes_recovery import KubernetesRecoveryService
from ..services.recovery_engine import RecoveryEngine
from ..services.rollback_manager import RollbackManager
from ..services.scaling_manager import ScalingManager

router = APIRouter(prefix="/api/recovery", tags=["Self-Healing & Recovery"])


class RecoveryPolicyUpdate(BaseModel):
    autoRecoveryEnabled: bool
    allowRestart: bool
    allowRollback: bool
    allowScaling: bool
    maxAttempts: int = Field(ge=1, le=10)
    cooldownSeconds: int = Field(ge=5, le=300)


class ManualRecoveryRequest(BaseModel):
    app_id: int
    incident_id: int | None = None
    action_type: str = "Container Restart"  # Container Restart, Pod Restart, Rollback, Autoscale
    pod_name: str | None = None
    scale_delta: int = 2


# 1. Recovery Records
@router.get("")
def list_recovery_actions(db: Session = Depends(get_db)):
    """Lists all recovery operations ordered from newest to oldest."""
    rows = db.scalars(select(RecoveryAction).order_by(RecoveryAction.created_at.desc())).all()
    return [recovery_out(r) for r in rows]


# Alias for backwards compatibility with Phase 2/3 frontend calls
@router.get("-actions")
def list_recovery_actions_legacy(db: Session = Depends(get_db)):
    return list_recovery_actions(db)


@router.get("/infrastructure-status")
def get_infrastructure_status():
    """Returns actual real-time status of Docker and Kubernetes infrastructure."""
    docker_status = DockerRecoveryService.get_infrastructure_status()
    k8s_status = KubernetesRecoveryService.get_cluster_status()
    return {
        "docker": docker_status,
        "kubernetes": k8s_status,
    }


@router.get("/policies")
def get_recovery_policies(db: Session = Depends(get_db)):
    """Fetches the active self-healing recovery policies."""
    policy = RecoveryEngine.get_policy(db)
    return policy_out(policy)


@router.put("/policies")
def update_recovery_policies(body: RecoveryPolicyUpdate, db: Session = Depends(get_db)):
    """Updates the autonomous self-healing policies."""
    policy = RecoveryEngine.get_policy(db)
    policy.auto_recovery_enabled = body.autoRecoveryEnabled
    policy.allow_restart = body.allowRestart
    policy.allow_rollback = body.allowRollback
    policy.allow_scaling = body.allowScaling
    policy.max_attempts = body.maxAttempts
    policy.cooldown_seconds = body.cooldownSeconds
    db.commit()
    db.refresh(policy)
    return policy_out(policy)


@router.get("/{action_id}")
def get_recovery_action(action_id: str, db: Session = Depends(get_db)):
    """Fetches a specific recovery record by code (e.g. REC-88) or numeric ID."""
    rec = db.scalar(select(RecoveryAction).where(RecoveryAction.code == action_id))
    if not rec and action_id.isdigit():
        rec = db.get(RecoveryAction, int(action_id))
    if not rec:
        raise HTTPException(status_code=404, detail="Recovery action not found")
    return recovery_out(rec)


@router.post("/execute")
async def execute_recovery_now(body: ManualRecoveryRequest, db: Session = Depends(get_db)):
    """
    Manually triggers an authorized recovery action on an application.
    Supports Container Restart, Deployment Rollback, Autoscaling, and Pod Restart.
    """
    app = db.get(Application, body.app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    incident = db.get(Incident, body.incident_id) if body.incident_id else None

    if body.action_type == "Container Restart":
        rec_action = await RecoveryEngine.execute_container_restart(
            db=db,
            app=app,
            incident=incident,
            triggered_by="operator_manual",
        )
        return recovery_out(rec_action)

    elif body.action_type == "Rollback":
        rec_action = await RollbackManager.execute_rollback(
            db=db,
            app=app,
            incident=incident,
            triggered_by="operator_manual",
        )
        return recovery_out(rec_action)

    elif body.action_type == "Autoscale":
        rec_action = ScalingManager.execute_scaling(
            db=db,
            app=app,
            delta=body.scale_delta or 2,
            incident=incident,
            triggered_by="operator_manual",
        )
        return recovery_out(rec_action)

    elif body.action_type == "Pod Restart":
        target_pod = body.pod_name or f"{app.name.lower().replace(' ', '-')}-7d9f4-x2k"
        rec_action = RecoveryEngine.execute_pod_recovery(
            db=db,
            app=app,
            pod_name=target_pod,
            incident=incident,
            triggered_by="operator_manual",
        )
        return recovery_out(rec_action)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Action '{body.action_type}' is not supported. Use 'Container Restart', 'Rollback', 'Autoscale', or 'Pod Restart'.",
        )


@router.post("/rollback/{app_id}")
async def trigger_rollback(app_id: int, db: Session = Depends(get_db)):
    """Dedicated endpoint to trigger automated deployment rollback for an application."""
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    rec = await RollbackManager.execute_rollback(db, app, triggered_by="operator_rollback_button")
    return recovery_out(rec)


@router.post("/scale/{app_id}")
def trigger_scale(app_id: int, delta: int = 2, db: Session = Depends(get_db)):
    """Dedicated endpoint to trigger replica scaling for an application."""
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    rec = ScalingManager.execute_scaling(db, app, delta=delta, triggered_by="operator_scale_button")
    return recovery_out(rec)


@router.post("/{action_id}/retry")
async def retry_recovery_action(action_id: str, db: Session = Depends(get_db)):
    """Retries a previously failed recovery action."""
    rec = db.scalar(select(RecoveryAction).where(RecoveryAction.code == action_id))
    if not rec and action_id.isdigit():
        rec = db.get(RecoveryAction, int(action_id))
    if not rec:
        raise HTTPException(status_code=404, detail="Recovery action not found")

    app = rec.app
    if not app:
        raise HTTPException(status_code=400, detail="Associated application no longer exists")

    if rec.action == "Container Restart":
        rec_action = await RecoveryEngine.execute_container_restart(
            db=db,
            app=app,
            incident=rec.incident,
            triggered_by="operator_retry",
        )
    elif rec.action == "Rollback":
        rec_action = await RollbackManager.execute_rollback(
            db=db,
            app=app,
            incident=rec.incident,
            triggered_by="operator_retry",
        )
    elif rec.action == "Autoscale":
        rec_action = ScalingManager.execute_scaling(
            db=db,
            app=app,
            delta=2,
            incident=rec.incident,
            triggered_by="operator_retry",
        )
    else:
        rec_action = RecoveryEngine.execute_pod_recovery(
            db=db,
            app=app,
            pod_name=rec.target or "sample-pod",
            incident=rec.incident,
            triggered_by="operator_retry",
        )

    return recovery_out(rec_action)
