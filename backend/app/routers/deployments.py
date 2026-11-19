import time
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..models import Activity, Application, Deployment
from ..serializers import deployment_out

router = APIRouter(prefix="/api/deployments", tags=["Deployments"])


class DeployRequest(BaseModel):
    app_id: int


def next_code(db: Session) -> str:
    last = db.scalar(select(Deployment.code).order_by(Deployment.id.desc()))
    number = int(last.split("-")[1]) + 1 if last else 1001
    return f"DEP-{number}"


def bump_patch(version: str) -> str:
    """v2.4.1 -> v2.4.2"""
    try:
        major, minor, patch = version.lstrip("v").split(".")
        return f"v{major}.{minor}.{int(patch) + 1}"
    except ValueError:
        return "v1.0.1"


def finish_deployment(deployment_id: int) -> None:
    """Runs in the background after the request has returned (simulated pipeline)."""
    time.sleep(3)
    with SessionLocal() as db:
        dep = db.get(Deployment, deployment_id)
        if dep is None:
            return
        seconds = int((datetime.now() - dep.created_at).total_seconds())
        dep.logs = [*dep.logs, "[docker] Image built (simulated)", "[k8s] Rollout complete (simulated)",
                    "[done] Deployment successful"]
        dep.status = "success"
        dep.duration = f"{seconds // 60}m {seconds % 60:02d}s"
        dep.app.version = dep.version
        dep.app.last_deploy_at = datetime.now()
        db.add(Activity(type="deploy", message=f"{dep.app.name} {dep.version} deployed successfully"))
        db.commit()


@router.get("")
def list_deployments(db: Session = Depends(get_db)):
    rows = db.scalars(select(Deployment).order_by(Deployment.created_at.desc(), Deployment.id.desc()))
    return [deployment_out(d) for d in rows]


@router.get("/{code}")
def get_deployment(code: str, db: Session = Depends(get_db)):
    dep = db.scalar(select(Deployment).where(Deployment.code == code))
    if dep is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment_out(dep)


@router.post("", status_code=201)
def trigger_deployment(body: DeployRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    app = db.get(Application, body.app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")

    dep = Deployment(
        code=next_code(db),
        app_id=app.id,
        version=bump_patch(app.version),
        status="running",
        branch="main",
        commit=uuid.uuid4().hex[:7],
        triggered_by="dashboard",
        logs=["[ci] Pipeline started", "[ci] Running tests...",
              "[simulated] Mock pipeline: real GitHub Actions is added in Phase 5"],
    )
    db.add(dep)
    db.add(Activity(type="deploy", message=f"Deployment of {app.name} {dep.version} started"))
    db.commit()
    db.refresh(dep)
    background.add_task(finish_deployment, dep.id)
    return deployment_out(dep)