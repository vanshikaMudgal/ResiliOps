from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, Application
from ..serializers import app_out

router = APIRouter(prefix="/api/applications", tags=["Applications"])


class ApplicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=300)


class MonitoringUpdate(BaseModel):
    enabled: bool


def get_or_404(db: Session, app_id: int) -> Application:
    app = db.get(Application, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("")
def list_applications(db: Session = Depends(get_db)):
    return [app_out(a) for a in db.scalars(select(Application).order_by(Application.id))]


@router.get("/{app_id}")
def get_application(app_id: int, db: Session = Depends(get_db)):
    return app_out(get_or_404(db, app_id))


@router.post("", status_code=201)
def register_application(body: ApplicationCreate, db: Session = Depends(get_db)):
    name = body.name.strip()
    if db.scalar(select(Application).where(Application.name == name)):
        raise HTTPException(status_code=409, detail=f"An application named '{name}' already exists")
    # Status stays 'unknown' until the health checker (Phase 3) actually checks it.
    app = Application(name=name, url=body.url.strip(), status="unknown", replicas=1, version="v1.0.0")
    db.add(app)
    db.add(Activity(type="app", message=f"Application '{name}' registered"))
    db.commit()
    db.refresh(app)
    return app_out(app)


@router.patch("/{app_id}/monitoring")
def set_monitoring(app_id: int, body: MonitoringUpdate, db: Session = Depends(get_db)):
    app = get_or_404(db, app_id)
    app.monitoring = body.enabled
    state = "started" if body.enabled else "stopped"
    db.add(Activity(type="app", message=f"Monitoring {state} for {app.name}"))
    db.commit()
    db.refresh(app)
    return app_out(app)