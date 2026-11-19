from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, MetricPoint
from ..serializers import activity_out, metric_out

router = APIRouter(prefix="/api", tags=["Overview"])


@router.get("/activities")
def list_activities(limit: int = 10, db: Session = Depends(get_db)):
    rows = db.scalars(select(Activity).order_by(Activity.created_at.desc()).limit(limit))
    return [activity_out(a) for a in rows]


@router.get("/metrics")
def list_metrics(db: Session = Depends(get_db)):
    return [metric_out(m) for m in db.scalars(select(MetricPoint).order_by(MetricPoint.id))]