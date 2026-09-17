from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from core import (
    CLASSROOM,
    current_user_id,
    db,
    q,
    single_tenant_or_raise,
)

router = APIRouter()


class CalendarEventIn(BaseModel):
    title: str
    description: str = ""
    event_type: str = "class"  # class, exam, homework, holiday, meeting
    start_at: str  # ISO 8601 string
    end_at: Optional[str] = None
    all_day: bool = False
    location: str = ""


class CalendarEventOut(BaseModel):
    id: str
    title: str
    description: str
    event_type: str
    start_at: str
    end_at: Optional[str]
    all_day: bool
    location: str


@router.get("/api/calendar/events", response_model=List[CalendarEventOut])
def list_calendar_events(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)
    with db() as conn:
        rows = q(
            conn,
            '''
            SELECT id, title, description, event_type, start_at, end_at, all_day, location
            FROM calendar_events
            WHERE tenant_id = %s
            ORDER BY start_at ASC
            ''',
            (tenant_id,),
        ).fetchall()

    return [
        CalendarEventOut(
            id=str(r[0]),
            title=r[1],
            description=r[2] or "",
            event_type=r[3],
            start_at=r[4].isoformat() if r[4] else "",
            end_at=r[5].isoformat() if r[5] else None,
            all_day=bool(r[6]),
            location=r[7] or "",
        )
        for r in rows
    ]


@router.post("/api/calendar/events", response_model=CalendarEventOut, status_code=201)
def create_calendar_event(body: CalendarEventIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

    try:
        start_dt = datetime.fromisoformat(body.start_at)
        end_dt = datetime.fromisoformat(body.end_at) if body.end_at else None
    except ValueError:
        raise HTTPException(400, "invalid date format; ISO 8601 required")

    with db() as conn:
        row = q(
            conn,
            '''
            INSERT INTO calendar_events (tenant_id, user_id, title, description, event_type, start_at, end_at, all_day, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, title, description, event_type, start_at, end_at, all_day, location
            ''',
            (
                tenant_id,
                uid,
                body.title.strip(),
                body.description.strip(),
                body.event_type.strip(),
                start_dt,
                end_dt,
                body.all_day,
                body.location.strip(),
            ),
        ).fetchone()

    return CalendarEventOut(
        id=str(row[0]),
        title=row[1],
        description=row[2] or "",
        event_type=row[3],
        start_at=row[4].isoformat() if row[4] else "",
        end_at=row[5].isoformat() if row[5] else None,
        all_day=bool(row[6]),
        location=row[7] or "",
    )


@router.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

    try:
        ev_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(404, "event not found")

    with db() as conn:
        deleted = q(
            conn,
            "DELETE FROM calendar_events WHERE id = %s AND tenant_id = %s RETURNING id",
            (ev_uuid, tenant_id),
        ).fetchone()
        if not deleted:
            raise HTTPException(404, "event not found")

    return {"status": "deleted", "id": event_id}
