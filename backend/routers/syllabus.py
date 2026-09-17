from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from core import (
    CLASSROOM,
    current_user_id,
    db,
    q,
    single_tenant_or_raise,
)

router = APIRouter()


class PacingToggleIn(BaseModel):
    section_id: Optional[str] = None
    topic_id: str
    is_completed: bool


@router.get("/api/syllabus/pacing")
def get_syllabus_pacing(section_id: Optional[str] = None, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        if not section_id:
            # Pick first section for tenant if not provided
            sec_row = q(conn, "SELECT id FROM sections WHERE tenant_id = %s LIMIT 1", (tenant_id,)).fetchone()
            if sec_row:
                section_id = str(sec_row[0])

        rows = []
        if section_id:
            try:
                sec_uuid = UUID(section_id)
                rows = q(
                    conn,
                    "SELECT topic_id, is_completed, completed_at FROM section_syllabus_pacing "
                    "WHERE tenant_id = %s AND section_id = %s",
                    (tenant_id, sec_uuid),
                ).fetchall()
            except ValueError:
                rows = []

    return {
        "section_id": section_id,
        "completed_topics": {
            r[0]: {"is_completed": r[1], "completed_at": r[2].isoformat() if r[2] else None}
            for r in rows
        },
    }


@router.post("/api/syllabus/pacing/toggle")
def toggle_syllabus_topic(body: PacingToggleIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, ("TEACHER", "ADMIN"))

    with db() as conn:
        section_id = body.section_id
        if not section_id:
            sec_row = q(conn, "SELECT id FROM sections WHERE tenant_id = %s LIMIT 1", (tenant_id,)).fetchone()
            if not sec_row:
                raise HTTPException(400, "no section available for this school")
            section_id = str(sec_row[0])

        try:
            sec_uuid = UUID(section_id)
        except ValueError:
            raise HTTPException(400, "invalid section_id")

        now = datetime.now(timezone.utc) if body.is_completed else None
        q(
            conn,
            '''
            INSERT INTO section_syllabus_pacing (tenant_id, section_id, topic_id, is_completed, completed_at, completed_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (tenant_id, section_id, topic_id)
            DO UPDATE SET is_completed = EXCLUDED.is_completed,
                          completed_at = EXCLUDED.completed_at,
                          completed_by = EXCLUDED.completed_by
            ''',
            (tenant_id, sec_uuid, body.topic_id, body.is_completed, now, uid),
        )

    return {"status": "ok", "topic_id": body.topic_id, "is_completed": body.is_completed}
