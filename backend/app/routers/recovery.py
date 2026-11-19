from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RecoveryAction
from ..serializers import recovery_out

router = APIRouter(prefix="/api/recovery-actions", tags=["Self-Healing"])


@router.get("")
def list_recovery_actions(db: Session = Depends(get_db)):
    rows = db.scalars(select(RecoveryAction).order_by(RecoveryAction.created_at.desc()))
    return [recovery_out(r) for r in rows]