from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, Incident, MonitoringLog
from ..serializers import incident_out

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


class IncidentStatusUpdate(BaseModel):
    status: str  # "open", "investigating", "resolved"


@router.get("")
def list_incidents(status: str | None = None, db: Session = Depends(get_db)):
    """Lists all incidents, optionally filtered by status, newest first."""
    query = select(Incident).order_by(Incident.detected_at.desc(), Incident.id.desc())
    if status and status != "all":
        query = query.where(Incident.status == status)
    return [incident_out(i) for i in db.scalars(query)]


@router.get("/{code}")
def get_incident(code: str, db: Session = Depends(get_db)):
    """Retrieves a specific incident by its code (e.g. INC-304) or numerical ID."""
    incident = db.scalar(select(Incident).where(Incident.code == code))
    if not incident and code.isdigit():
        incident = db.get(Incident, int(code))
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{code}' not found")
    return incident_out(incident)


@router.patch("/{code}/status")
def update_incident_status(code: str, body: IncidentStatusUpdate, db: Session = Depends(get_db)):
    """Updates an incident's status (open -> investigating -> resolved)."""
    incident = db.scalar(select(Incident).where(Incident.code == code))
    if not incident and code.isdigit():
        incident = db.get(Incident, int(code))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    new_status = body.status.lower()
    if new_status not in ["open", "investigating", "resolved"]:
        raise HTTPException(status_code=400, detail="Status must be 'open', 'investigating', or 'resolved'")

    incident.status = new_status
    if new_status == "resolved" and not incident.resolved_at:
        incident.resolved_at = datetime.now()

    db.add(Activity(type="incident", message=f"Incident {incident.code} marked as {new_status}"))
    db.add(
        MonitoringLog(
            level="INFO",
            source="incident_manager",
            message=f"Incident {incident.code} status changed to {new_status}",
            details=f"App: {incident.app.name if incident.app else 'System'}",
        )
    )
    db.commit()
    db.refresh(incident)
    return incident_out(incident)


@router.post("/{code}/resolve")
def resolve_incident(code: str, db: Session = Depends(get_db)):
    """Convenience endpoint to resolve an incident."""
    return update_incident_status(code, IncidentStatusUpdate(status="resolved"), db)
