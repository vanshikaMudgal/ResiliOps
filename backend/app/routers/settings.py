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


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    return settings_out(db.get(DetectionSettings, 1))


@router.put("")
def update_settings(body: SettingsIn, db: Session = Depends(get_db)):
    row = db.get(DetectionSettings, 1)
    row.cpu_threshold = body.cpu
    row.memory_threshold = body.memory
    row.failure_threshold = body.failures
    row.interval_seconds = body.interval
    db.commit()
    return settings_out(row)