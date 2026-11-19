from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Incident
from ..serializers import incident_out

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("")
def list_incidents(status: str | None = None, db: Session = Depends(get_db)):
    query = select(Incident).order_by(Incident.detected_at.desc())
    if status:
        query = query.where(Incident.status == status)
    return [incident_out(i) for i in db.scalars(query)]