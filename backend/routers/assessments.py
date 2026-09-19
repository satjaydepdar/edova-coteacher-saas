"""Assessment Builder router: CBSE blueprint-aligned examination authoring and calendar scheduling."""
import json
from datetime import datetime, date, timedelta, timezone
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


class QuestionOption(BaseModel):
    key: str  # A, B, C, D
    text: str
    correct: bool = False


class MatchingPair(BaseModel):
    left: str
    right: str


class SubQuestion(BaseModel):
    text: str
    answer: str


class QuestionIn(BaseModel):
    id: Optional[str] = None
    text: str
    options: Optional[List[QuestionOption]] = None
    difficulty: str = "Medium"  # Easy, Medium, Hard
    bloom: str = "Understand"   # Remember, Understand, Apply, Analyze, Evaluate, Create
    rubric: Optional[str] = None
    marks: int = 1
    # Palette question shapes (Matching / Fill-in-Blank / Short Answer / Scenario /
    # Multi-Part) — field names match the frontend QuestionItem shape verbatim
    # (no alias) since `sections` round-trips as raw JSON into a JSONB column.
    pairs: Optional[List[MatchingPair]] = None
    correctAnswer: Optional[str] = None
    modelAnswer: Optional[str] = None
    scenarioText: Optional[str] = None
    subQuestions: Optional[List[SubQuestion]] = None


class AssessmentSectionIn(BaseModel):
    section_id: str  # sec-a, sec-b, etc.
    name: str        # Section A, Section B, etc.
    type: str        # mcq, short_answer_1, short_answer_2, long_answer, case_study
    marks_per_q: int = 1
    instructions: str = ""
    questions: List[QuestionIn] = Field(default_factory=list)


class AssessmentIn(BaseModel):
    title: str
    subject: str = "Mathematics"
    class_label: str = "Class 10"
    section_name: str = "10-A"
    blueprint_type: str = "cbse_80m"  # cbse_80m, periodic_40m, unit_20m, custom
    duration_minutes: int = 180
    total_marks: int = 80
    instructions: str = "All questions are compulsory."
    sections: List[AssessmentSectionIn] = Field(default_factory=list)
    scheduled_date: Optional[str] = None
    status: str = "draft"  # draft, ready, scheduled, completed


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    class_label: Optional[str] = None
    section_name: Optional[str] = None
    blueprint_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    instructions: Optional[str] = None
    sections: Optional[List[AssessmentSectionIn]] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None


class ScheduleExamIn(BaseModel):
    scheduled_date: str  # YYYY-MM-DD
    start_time: str = "09:30"  # HH:MM
    location: str = "Examination Hall A"


class AssessmentSummaryOut(BaseModel):
    id: str
    tenant_id: str
    created_by: str
    title: str
    subject: str
    class_label: str
    section_name: str
    blueprint_type: str
    duration_minutes: int
    total_marks: int
    instructions: str
    question_count: int
    section_count: int
    sections_summary: List[Dict[str, Any]]
    difficulty_spread: Dict[str, int]
    scheduled_date: Optional[str]
    calendar_event_id: Optional[str]
    status: str
    created_at: str
    updated_at: str


class AssessmentDetailOut(AssessmentSummaryOut):
    sections: List[Dict[str, Any]]


def calculate_balance(sections_list: list):
    q_count = 0
    diff_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    sec_summaries = []

    for s in sections_list:
        qs = s.get("questions", [])
        q_count += len(qs)
        sec_summaries.append({
            "section_id": s.get("section_id"),
            "name": s.get("name"),
            "type": s.get("type"),
            "marks_per_q": s.get("marks_per_q", 1),
            "question_count": len(qs),
            "subtotal": len(qs) * s.get("marks_per_q", 1)
        })
        for q_item in qs:
            d = q_item.get("difficulty", "Medium")
            if d in diff_counts:
                diff_counts[d] += 1
            else:
                diff_counts["Medium"] += 1

    total_q = max(1, q_count)
    diff_spread = {
        "easy": round((diff_counts["Easy"] / total_q) * 100),
        "medium": round((diff_counts["Medium"] / total_q) * 100),
        "hard": round((diff_counts["Hard"] / total_q) * 100),
    }

    return q_count, len(sections_list), sec_summaries, diff_spread


def row_to_summary_out(row) -> AssessmentSummaryOut:
    secs = row[10] if isinstance(row[10], list) else (json.loads(row[10]) if row[10] else [])
    q_count, sec_count, summaries, diff_spread = calculate_balance(secs)

    return AssessmentSummaryOut(
        id=str(row[0]),
        tenant_id=str(row[1]),
        created_by=str(row[2]),
        title=row[3],
        subject=row[4],
        class_label=row[5],
        section_name=row[6] or "10-A",
        blueprint_type=row[7] or "cbse_80m",
        duration_minutes=int(row[8]),
        total_marks=int(row[9]),
        instructions=row[10] if isinstance(row[10], str) else "", # will use row[10] below
        question_count=q_count,
        section_count=sec_count,
        sections_summary=summaries,
        difficulty_spread=diff_spread,
        scheduled_date=row[12].isoformat() if isinstance(row[12], (date, datetime)) else (str(row[12]) if row[12] else None),
        calendar_event_id=str(row[13]) if row[13] else None,
        status=row[14] or "draft",
        created_at=row[15].isoformat() if isinstance(row[15], datetime) else str(row[15]),
        updated_at=row[16].isoformat() if isinstance(row[16], datetime) else str(row[16]),
    )


SELECT_COLS = """
    id, tenant_id, created_by, title, subject, class_label, section_name,
    blueprint_type, duration_minutes, total_marks, instructions,
    sections, scheduled_date, calendar_event_id, status, created_at, updated_at
"""


def parse_row(row, detail: bool = False):
    secs = row[11] if isinstance(row[11], list) else (json.loads(row[11]) if row[11] else [])
    q_count, sec_count, summaries, diff_spread = calculate_balance(secs)

    summary_kwargs = {
        "id": str(row[0]),
        "tenant_id": str(row[1]),
        "created_by": str(row[2]),
        "title": row[3],
        "subject": row[4],
        "class_label": row[5],
        "section_name": row[6] or "10-A",
        "blueprint_type": row[7] or "cbse_80m",
        "duration_minutes": int(row[8]),
        "total_marks": int(row[9]),
        "instructions": row[10] or "",
        "question_count": q_count,
        "section_count": sec_count,
        "sections_summary": summaries,
        "difficulty_spread": diff_spread,
        "scheduled_date": row[12].isoformat() if isinstance(row[12], (date, datetime)) else (str(row[12]) if row[12] else None),
        "calendar_event_id": str(row[13]) if row[13] else None,
        "status": row[14] or "draft",
        "created_at": row[15].isoformat() if isinstance(row[15], datetime) else str(row[15]),
        "updated_at": row[16].isoformat() if isinstance(row[16], datetime) else str(row[16]),
    }

    if detail:
        return AssessmentDetailOut(**summary_kwargs, sections=secs)
    return AssessmentSummaryOut(**summary_kwargs)


@router.get("/api/assessments", response_model=List[AssessmentSummaryOut])
def list_assessments(
    authorization: str = Header(...),
    status: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    class_label: Optional[str] = Query(None),
):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        query = f"SELECT {SELECT_COLS} FROM assessments WHERE tenant_id = %s"
        params = [tenant_id]

        if status and status != "all":
            query += " AND status = %s"
            params.append(status)
        if subject:
            query += " AND subject = %s"
            params.append(subject)
        if class_label:
            query += " AND class_label = %s"
            params.append(class_label)

        query += " ORDER BY scheduled_date ASC NULLS LAST, updated_at DESC"
        rows = q(conn, query, tuple(params)).fetchall()

    return [parse_row(r, detail=False) for r in rows]


@router.post("/api/assessments", response_model=AssessmentDetailOut, status_code=201)
def create_assessment(body: AssessmentIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    sections_json = [s.model_dump() for s in body.sections]

    with db() as conn:
        row = q(conn, f"""
            INSERT INTO assessments (
                tenant_id, created_by, title, subject, class_label, section_name,
                blueprint_type, duration_minutes, total_marks, instructions,
                sections, scheduled_date, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s
            ) RETURNING {SELECT_COLS}
        """, (
            tenant_id, uid, body.title, body.subject, body.class_label, body.section_name,
            body.blueprint_type, body.duration_minutes, body.total_marks, body.instructions,
            json.dumps(sections_json), body.scheduled_date, body.status
        )).fetchone()
        conn.commit()

    return parse_row(row, detail=True)


@router.get("/api/assessments/{assessment_id}", response_model=AssessmentDetailOut)
def get_assessment(assessment_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, f"""
            SELECT {SELECT_COLS} FROM assessments
            WHERE id = %s AND tenant_id = %s
        """, (assessment_id, tenant_id)).fetchone()

    if not row:
        raise HTTPException(404, "Assessment not found")

    return parse_row(row, detail=True)


@router.put("/api/assessments/{assessment_id}", response_model=AssessmentDetailOut)
def update_assessment(assessment_id: str, body: AssessmentUpdate, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        existing = q(conn, "SELECT id FROM assessments WHERE id = %s AND tenant_id = %s", (assessment_id, tenant_id)).fetchone()
        if not existing:
            raise HTTPException(404, "Assessment not found")

        updates = []
        params = []
        if body.title is not None:
            updates.append("title = %s")
            params.append(body.title)
        if body.subject is not None:
            updates.append("subject = %s")
            params.append(body.subject)
        if body.class_label is not None:
            updates.append("class_label = %s")
            params.append(body.class_label)
        if body.section_name is not None:
            updates.append("section_name = %s")
            params.append(body.section_name)
        if body.blueprint_type is not None:
            updates.append("blueprint_type = %s")
            params.append(body.blueprint_type)
        if body.duration_minutes is not None:
            updates.append("duration_minutes = %s")
            params.append(body.duration_minutes)
        if body.total_marks is not None:
            updates.append("total_marks = %s")
            params.append(body.total_marks)
        if body.instructions is not None:
            updates.append("instructions = %s")
            params.append(body.instructions)
        if body.sections is not None:
            updates.append("sections = %s")
            params.append(json.dumps([s.model_dump() for s in body.sections]))
        if body.scheduled_date is not None:
            updates.append("scheduled_date = %s")
            params.append(body.scheduled_date)
        if body.status is not None:
            updates.append("status = %s")
            params.append(body.status)

        if updates:
            updates.append("updated_at = NOW()")
            sql = f"UPDATE assessments SET {', '.join(updates)} WHERE id = %s AND tenant_id = %s RETURNING {SELECT_COLS}"
            params.extend([assessment_id, tenant_id])
            row = q(conn, sql, tuple(params)).fetchone()
            conn.commit()
        else:
            row = q(conn, f"SELECT {SELECT_COLS} FROM assessments WHERE id = %s", (assessment_id,)).fetchone()

    return parse_row(row, detail=True)


@router.delete("/api/assessments/{assessment_id}")
def delete_assessment(assessment_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, "SELECT calendar_event_id FROM assessments WHERE id = %s AND tenant_id = %s", (assessment_id, tenant_id)).fetchone()
        if not row:
            raise HTTPException(404, "Assessment not found")

        cal_id = row[0]
        q(conn, "DELETE FROM assessments WHERE id = %s AND tenant_id = %s", (assessment_id, tenant_id))
        if cal_id:
            q(conn, "DELETE FROM calendar_events WHERE id = %s AND tenant_id = %s", (cal_id, tenant_id))
        conn.commit()

    return {"status": "ok", "deleted_id": assessment_id}


@router.post("/api/assessments/{assessment_id}/schedule", response_model=AssessmentDetailOut)
def schedule_assessment_exam(assessment_id: str, sched: ScheduleExamIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, f"SELECT {SELECT_COLS} FROM assessments WHERE id = %s AND tenant_id = %s", (assessment_id, tenant_id)).fetchone()
        if not row:
            raise HTTPException(404, "Assessment not found")

        title = row[3]
        section_name = row[6] or "10-A"
        duration_mins = int(row[8])
        total_marks = int(row[9])
        old_cal_id = row[13]

        start_dt_str = f"{sched.scheduled_date}T{sched.start_time}:00"
        start_dt = datetime.fromisoformat(start_dt_str)
        end_dt = start_dt + timedelta(minutes=duration_mins)

        cal_title = f"Exam: {title} ({section_name})"
        cal_desc = f"Formal Assessment | Total Marks: {total_marks} | Duration: {duration_mins} mins"

        if old_cal_id:
            # Update existing calendar event
            q(conn, """
                UPDATE calendar_events
                SET title = %s, description = %s, start_at = %s, end_at = %s, location = %s
                WHERE id = %s AND tenant_id = %s
            """, (cal_title, cal_desc, start_dt.isoformat(), end_dt.isoformat(), sched.location, old_cal_id, tenant_id))
            cal_id = old_cal_id
        else:
            # Insert new calendar event
            ev_row = q(conn, """
                INSERT INTO calendar_events (
                    tenant_id, user_id, title, description, event_type,
                    start_at, end_at, all_day, location
                ) VALUES (
                    %s, %s, %s, %s, 'exam',
                    %s, %s, FALSE, %s
                ) RETURNING id
            """, (
                tenant_id, uid, cal_title, cal_desc,
                start_dt.isoformat(), end_dt.isoformat(), sched.location
            )).fetchone()
            cal_id = ev_row[0]

        updated_row = q(conn, f"""
            UPDATE assessments
            SET scheduled_date = %s, calendar_event_id = %s, status = 'scheduled', updated_at = NOW()
            WHERE id = %s AND tenant_id = %s
            RETURNING {SELECT_COLS}
        """, (sched.scheduled_date, cal_id, assessment_id, tenant_id)).fetchone()
        conn.commit()

    return parse_row(updated_row, detail=True)
