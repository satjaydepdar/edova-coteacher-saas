"""Lesson Plans router: CRUD, pedagogical tracking (5E phases, Bloom, NEP), and calendar scheduling."""
from datetime import datetime, date, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from core import (
    CLASSROOM,
    current_user_id,
    db,
    q,
    single_tenant_or_raise,
)

router = APIRouter()


class LessonPlanPhases(BaseModel):
    warmup: str = ""
    instruction: str = ""
    activity: str = ""
    assessment: str = ""
    homework: str = ""


class LessonPlanIn(BaseModel):
    title: str
    subject: str = "Mathematics"
    class_label: str = "Class 10"
    section_name: str = "Section A"
    unit_id: Optional[str] = None
    chapter_id: Optional[str] = None
    topic_id: Optional[str] = None
    duration_minutes: int = 45
    objective: str = ""
    outcomes: List[str] = Field(default_factory=list)
    bloom_levels: List[str] = Field(default_factory=list)
    nep_tags: List[str] = Field(default_factory=list)
    phases: LessonPlanPhases = Field(default_factory=LessonPlanPhases)
    materials: List[str] = Field(default_factory=list)
    scheduled_date: Optional[str] = None  # YYYY-MM-DD
    status: str = "draft"  # draft, planned, scheduled, completed


class LessonPlanUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    class_label: Optional[str] = None
    section_name: Optional[str] = None
    unit_id: Optional[str] = None
    chapter_id: Optional[str] = None
    topic_id: Optional[str] = None
    duration_minutes: Optional[int] = None
    objective: Optional[str] = None
    outcomes: Optional[List[str]] = None
    bloom_levels: Optional[List[str]] = None
    nep_tags: Optional[List[str]] = None
    phases: Optional[LessonPlanPhases] = None
    materials: Optional[List[str]] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None


class ScheduleLessonIn(BaseModel):
    scheduled_date: str  # YYYY-MM-DD
    start_time: str = "09:00"  # HH:MM
    location: str = "Classroom"


class LessonPlanOut(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    title: str
    subject: str
    class_label: str
    section_name: str
    unit_id: Optional[str]
    chapter_id: Optional[str]
    topic_id: Optional[str]
    duration_minutes: int
    objective: str
    outcomes: List[str]
    bloom_levels: List[str]
    nep_tags: List[str]
    phases: Dict[str, Any]
    materials: List[str]
    scheduled_date: Optional[str]
    calendar_event_id: Optional[str]
    status: str
    created_at: str
    updated_at: str


def row_to_plan_out(row) -> LessonPlanOut:
    import json
    return LessonPlanOut(
        id=str(row[0]),
        tenant_id=str(row[1]),
        user_id=str(row[2]),
        title=row[3],
        subject=row[4],
        class_label=row[5],
        section_name=row[6] or "Section A",
        unit_id=row[7],
        chapter_id=row[8],
        topic_id=row[9],
        duration_minutes=row[10] or 45,
        objective=row[11] or "",
        outcomes=row[12] if isinstance(row[12], list) else (json.loads(row[12]) if row[12] else []),
        bloom_levels=row[13] if isinstance(row[13], list) else (json.loads(row[13]) if row[13] else []),
        nep_tags=row[14] if isinstance(row[14], list) else (json.loads(row[14]) if row[14] else []),
        phases=row[15] if isinstance(row[15], dict) else (json.loads(row[15]) if row[15] else {}),
        materials=row[16] if isinstance(row[16], list) else (json.loads(row[16]) if row[16] else []),
        scheduled_date=row[17].isoformat() if isinstance(row[17], (date, datetime)) else (str(row[17]) if row[17] else None),
        calendar_event_id=str(row[18]) if row[18] else None,
        status=row[19] or "draft",
        created_at=row[20].isoformat() if isinstance(row[20], datetime) else str(row[20]),
        updated_at=row[21].isoformat() if isinstance(row[21], datetime) else str(row[21]),
    )


SELECT_COLS = """
    id, tenant_id, user_id, title, subject, class_label, section_name,
    unit_id, chapter_id, topic_id, duration_minutes, objective,
    outcomes, bloom_levels, nep_tags, phases, materials,
    scheduled_date, calendar_event_id, status, created_at, updated_at
"""


@router.get("/api/lessons/plans", response_model=List[LessonPlanOut])
def list_lesson_plans(
    authorization: str = Header(...),
    status: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    class_label: Optional[str] = Query(None),
):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)
    with db() as conn:
        query = f"SELECT {SELECT_COLS} FROM lesson_plans WHERE tenant_id = %s"
        params = [tenant_id]

        if status:
            query += " AND status = %s"
            params.append(status)
        if subject:
            query += " AND subject = %s"
            params.append(subject)
        if class_label:
            query += " AND class_label = %s"
            params.append(class_label)

        query += " ORDER BY updated_at DESC"
        rows = q(conn, query, tuple(params)).fetchall()

    return [row_to_plan_out(r) for r in rows]


@router.post("/api/lessons/plans", response_model=LessonPlanOut, status_code=201)
def create_lesson_plan(plan: LessonPlanIn, authorization: str = Header(...)):
    import json
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, f"""
            INSERT INTO lesson_plans (
                tenant_id, user_id, title, subject, class_label, section_name,
                unit_id, chapter_id, topic_id, duration_minutes, objective,
                outcomes, bloom_levels, nep_tags, phases, materials,
                scheduled_date, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s
            ) RETURNING {SELECT_COLS}
        """, (
            tenant_id, uid, plan.title, plan.subject, plan.class_label, plan.section_name,
            plan.unit_id, plan.chapter_id, plan.topic_id, plan.duration_minutes, plan.objective,
            json.dumps(plan.outcomes), json.dumps(plan.bloom_levels), json.dumps(plan.nep_tags),
            json.dumps(plan.phases.model_dump()), json.dumps(plan.materials),
            plan.scheduled_date, plan.status
        )).fetchone()
        conn.commit()

    return row_to_plan_out(row)


@router.get("/api/lessons/plans/{plan_id}", response_model=LessonPlanOut)
def get_lesson_plan(plan_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, f"""
            SELECT {SELECT_COLS} FROM lesson_plans
            WHERE id = %s AND tenant_id = %s
        """, (plan_id, tenant_id)).fetchone()

    if not row:
        raise HTTPException(404, "Lesson plan not found")

    return row_to_plan_out(row)


@router.put("/api/lessons/plans/{plan_id}", response_model=LessonPlanOut)
def update_lesson_plan(plan_id: str, update: LessonPlanUpdate, authorization: str = Header(...)):
    import json
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        # Check existence
        existing = q(conn, "SELECT id FROM lesson_plans WHERE id = %s AND tenant_id = %s", (plan_id, tenant_id)).fetchone()
        if not existing:
            raise HTTPException(404, "Lesson plan not found")

        updates = []
        params = []
        if update.title is not None:
            updates.append("title = %s")
            params.append(update.title)
        if update.subject is not None:
            updates.append("subject = %s")
            params.append(update.subject)
        if update.class_label is not None:
            updates.append("class_label = %s")
            params.append(update.class_label)
        if update.section_name is not None:
            updates.append("section_name = %s")
            params.append(update.section_name)
        if update.unit_id is not None:
            updates.append("unit_id = %s")
            params.append(update.unit_id)
        if update.chapter_id is not None:
            updates.append("chapter_id = %s")
            params.append(update.chapter_id)
        if update.topic_id is not None:
            updates.append("topic_id = %s")
            params.append(update.topic_id)
        if update.duration_minutes is not None:
            updates.append("duration_minutes = %s")
            params.append(update.duration_minutes)
        if update.objective is not None:
            updates.append("objective = %s")
            params.append(update.objective)
        if update.outcomes is not None:
            updates.append("outcomes = %s")
            params.append(json.dumps(update.outcomes))
        if update.bloom_levels is not None:
            updates.append("bloom_levels = %s")
            params.append(json.dumps(update.bloom_levels))
        if update.nep_tags is not None:
            updates.append("nep_tags = %s")
            params.append(json.dumps(update.nep_tags))
        if update.phases is not None:
            updates.append("phases = %s")
            params.append(json.dumps(update.phases.model_dump()))
        if update.materials is not None:
            updates.append("materials = %s")
            params.append(json.dumps(update.materials))
        if update.scheduled_date is not None:
            updates.append("scheduled_date = %s")
            params.append(update.scheduled_date)
        if update.status is not None:
            updates.append("status = %s")
            params.append(update.status)

        updates.append("updated_at = NOW()")

        sql = f"UPDATE lesson_plans SET {', '.join(updates)} WHERE id = %s AND tenant_id = %s RETURNING {SELECT_COLS}"
        params.extend([plan_id, tenant_id])

        row = q(conn, sql, tuple(params)).fetchone()
        conn.commit()

    return row_to_plan_out(row)


@router.delete("/api/lessons/plans/{plan_id}")
def delete_lesson_plan(plan_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        q(conn, "DELETE FROM lesson_plans WHERE id = %s AND tenant_id = %s", (plan_id, tenant_id))
        conn.commit()

    return {"status": "ok", "deleted_id": plan_id}


@router.post("/api/lessons/plans/{plan_id}/schedule", response_model=LessonPlanOut)
def schedule_lesson_to_calendar(plan_id: str, sched: ScheduleLessonIn, authorization: str = Header(...)):
    from datetime import datetime, timedelta
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        plan_row = q(conn, f"SELECT {SELECT_COLS} FROM lesson_plans WHERE id = %s AND tenant_id = %s", (plan_id, tenant_id)).fetchone()
        if not plan_row:
            raise HTTPException(404, "Lesson plan not found")

        plan = row_to_plan_out(plan_row)

        # Parse start and end timestamps
        start_dt_str = f"{sched.scheduled_date}T{sched.start_time}:00"
        start_dt = datetime.fromisoformat(start_dt_str)
        end_dt = start_dt + timedelta(minutes=plan.duration_minutes)

        event_title = f"{plan.class_label} ({plan.section_name}): {plan.title}"
        event_desc = f"Lesson Plan: {plan.objective[:120]}"

        # Insert into calendar_events
        ev_row = q(conn, """
            INSERT INTO calendar_events (
                tenant_id, user_id, title, description, event_type,
                start_at, end_at, all_day, location
            ) VALUES (
                %s, %s, %s, %s, 'class',
                %s, %s, FALSE, %s
            ) RETURNING id
        """, (
            tenant_id, uid, event_title, event_desc,
            start_dt.isoformat(), end_dt.isoformat(), sched.location
        )).fetchone()
        cal_event_id = str(ev_row[0])

        # Link calendar_event_id to lesson_plans
        updated_row = q(conn, f"""
            UPDATE lesson_plans
            SET scheduled_date = %s, calendar_event_id = %s, status = 'scheduled', updated_at = NOW()
            WHERE id = %s AND tenant_id = %s
            RETURNING {SELECT_COLS}
        """, (sched.scheduled_date, cal_event_id, plan_id, tenant_id)).fetchone()
        conn.commit()

    return row_to_plan_out(updated_row)
