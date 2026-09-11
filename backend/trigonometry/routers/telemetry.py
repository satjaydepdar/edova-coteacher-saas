"""Ported from edova-pilot-v4/backend/app/api/telemetry.py.
Adapted: student_id comes from the verified auth token."""
from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import TelemetryEvent
from trigonometry.schemas import TelemetryEventCreate, TelemetryEventResponse

router = APIRouter(prefix="/api/trig/telemetry", tags=["Trigonometry Telemetry"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

@router.post("/event", response_model=TelemetryEventResponse)
def log_telemetry_event(event_data: TelemetryEventCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Logs granular UI click-stream event (e.g. calculator tap, hint toggle, option click)."""
    p = current_principal(authorization)
    student_id = _student_id(p)

    event = TelemetryEvent(
        student_id=student_id,
        concept_id=event_data.concept_id or "trig-101",
        step_index=event_data.step_index,
        event_type=event_data.event_type,
        event_payload=event_data.event_payload or {},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return TelemetryEventResponse(status="logged", event_id=event.id, timestamp=event.timestamp.isoformat())

@router.get("/events")
def get_student_telemetry_events(
    concept_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Retrieves recent telemetry click-stream events for student diagnostics & analytics."""
    p = current_principal(authorization)
    student_id = _student_id(p)

    query = db.query(TelemetryEvent).filter(TelemetryEvent.student_id == student_id)
    if concept_id:
        query = query.filter(TelemetryEvent.concept_id == concept_id)

    events = query.order_by(TelemetryEvent.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": e.id,
            "concept_id": e.concept_id,
            "step_index": e.step_index,
            "event_type": e.event_type,
            "event_payload": e.event_payload,
            "timestamp": e.timestamp.isoformat()
        }
        for e in reversed(events)
    ]
