from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DetectionSettings
from ..serializers import settings_out

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsIn(BaseModel):
    cpu: int = Field(ge=50, le=100)
    memory: int = Field(ge=50, le=100)
    failures: int = Field(ge=1, le=10)
    interval: int = Field(ge=5, le=120)
    response: int = Field(default=500, ge=50, le=5000)


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    """Fetches the active failure-detection threshold settings from SQLite."""
    row = db.get(DetectionSettings, 1)
    if not row:
        row = DetectionSettings(id=1, cpu_threshold=80, memory_threshold=85, failure_threshold=3, interval_seconds=30, response_threshold=500)
        db.add(row)
        db.commit()
        db.refresh(row)
    return settings_out(row)


@router.put("")
def update_settings(body: SettingsIn, db: Session = Depends(get_db)):
    """Updates the failure-detection thresholds in SQLite."""
    row = db.get(DetectionSettings, 1)
    if not row:
        row = DetectionSettings(id=1)
        db.add(row)

    row.cpu_threshold = body.cpu
    row.memory_threshold = body.memory
    row.failure_threshold = body.failures
    row.interval_seconds = body.interval
    row.response_threshold = body.response
    db.commit()
    db.refresh(row)
    return settings_out(row)
