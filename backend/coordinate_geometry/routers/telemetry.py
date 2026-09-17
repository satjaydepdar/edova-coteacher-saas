"""Mirrors trigonometry/routers/telemetry.py -- fully functional, no reasoner dependency."""
from fastapi import APIRouter, Header, Query
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import Optional
from datetime import datetime, timezone

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import TelemetryEvent
from coordinate_geometry.schemas import TelemetryEventCreate, TelemetryEventResponse

router = APIRouter(prefix="/api/coordgeo/telemetry", tags=["Coordinate Geometry Telemetry"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

@router.post("/event", response_model=TelemetryEventResponse)
def log_telemetry_event(event_data: TelemetryEventCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    p = current_principal(authorization)
    student_id = _student_id(p)

    event = TelemetryEvent(
        student_id=student_id,
        concept_id=event_data.concept_id or "coordgeo-c1",
        step_index=event_data.step_index,
        event_type=event_data.event_type,
        event_payload=event_data.event_payload or {},
        timestamp=datetime.now(timezone.utc),
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
    db: Session = Depends(get_db),
):
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
            "timestamp": e.timestamp.isoformat(),
        }
        for e in reversed(events)
    ]
