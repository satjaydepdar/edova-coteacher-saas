"""Assignment Tracker router: assignment lifecycle, submission tracking, calendar due date sync, and grading."""
from datetime import datetime, timezone
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


class AssignmentIn(BaseModel):
    title: str
    description: str = ""
    section_name: str = "10-A"
    subject: str = "Mathematics"
    type: str = "homework"  # homework, worksheet, project, practice
    total_points: float = 100.0
    due_date: Optional[str] = None  # ISO 8601
    lesson_plan_id: Optional[str] = None
    status: str = "published"  # draft, published, closed
    sync_calendar: bool = True


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    section_name: Optional[str] = None
    subject: Optional[str] = None
    type: Optional[str] = None
    total_points: Optional[float] = None
    due_date: Optional[str] = None
    status: Optional[str] = None


class GradeSubmissionIn(BaseModel):
    student_id: str
    score: float
    feedback: str = ""


class SubmissionOut(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: str
    status: str  # pending, submitted, graded, late, missing
    score: Optional[float]
    feedback: str
    submitted_at: Optional[str]
    graded_at: Optional[str]


class AssignmentSummaryOut(BaseModel):
    id: str
    tenant_id: str
    created_by: str
    section_name: str
    subject: str
    lesson_plan_id: Optional[str]
    title: str
    description: str
    type: str
    total_points: float
    due_date: Optional[str]
    calendar_event_id: Optional[str]
    status: str
    created_at: str
    total_students: int
    submitted_count: int
    graded_count: int
    pending_count: int
    avg_score: Optional[float]


class AssignmentDetailOut(AssignmentSummaryOut):
    submissions: List[SubmissionOut]


def fetch_assignment_summary(conn, assignment_id: str, tenant_id: str) -> Optional[AssignmentSummaryOut]:
    row = q(conn, """
        SELECT 
            a.id, a.tenant_id, a.created_by, a.section_name, a.subject,
            a.lesson_plan_id, a.title, a.description, a.type, a.total_points,
            a.due_date, a.calendar_event_id, a.status, a.created_at,
            COUNT(s.id) as total_students,
            COUNT(CASE WHEN s.status IN ('submitted', 'graded', 'late') THEN 1 END) as submitted_count,
            COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
            COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_count,
            AVG(CASE WHEN s.status = 'graded' THEN s.score END) as avg_score
        FROM assignments a
        LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
        WHERE a.id = %s AND a.tenant_id = %s
        GROUP BY a.id
    """, (assignment_id, tenant_id)).fetchone()

    if not row:
        return None

    return AssignmentSummaryOut(
        id=str(row[0]),
        tenant_id=str(row[1]),
        created_by=str(row[2]),
        section_name=row[3],
        subject=row[4],
        lesson_plan_id=str(row[5]) if row[5] else None,
        title=row[6],
        description=row[7] or "",
        type=row[8] or "homework",
        total_points=float(row[9]),
        due_date=row[10].isoformat() if row[10] else None,
        calendar_event_id=str(row[11]) if row[11] else None,
        status=row[12] or "published",
        created_at=row[13].isoformat() if row[13] else "",
        total_students=int(row[14]),
        submitted_count=int(row[15]),
        graded_count=int(row[16]),
        pending_count=int(row[17]),
        avg_score=round(float(row[18]), 1) if row[18] is not None else None,
    )


@router.get("/api/assignments", response_model=List[AssignmentSummaryOut])
def list_assignments(
    authorization: str = Header(...),
    section_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        query = """
            SELECT 
                a.id, a.tenant_id, a.created_by, a.section_name, a.subject,
                a.lesson_plan_id, a.title, a.description, a.type, a.total_points,
                a.due_date, a.calendar_event_id, a.status, a.created_at,
                COUNT(s.id) as total_students,
                COUNT(CASE WHEN s.status IN ('submitted', 'graded', 'late') THEN 1 END) as submitted_count,
                COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
                COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_count,
                AVG(CASE WHEN s.status = 'graded' THEN s.score END) as avg_score
            FROM assignments a
            LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
            WHERE a.tenant_id = %s
        """
        params = [tenant_id]

        if section_name and section_name != "All":
            query += " AND a.section_name = %s"
            params.append(section_name)
        if status and status != "all":
            query += " AND a.status = %s"
            params.append(status)
        if type and type != "all":
            query += " AND a.type = %s"
            params.append(type)

        query += " GROUP BY a.id ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC"
        rows = q(conn, query, tuple(params)).fetchall()

    results = []
    for r in rows:
        results.append(AssignmentSummaryOut(
            id=str(r[0]),
            tenant_id=str(r[1]),
            created_by=str(r[2]),
            section_name=r[3],
            subject=r[4],
            lesson_plan_id=str(r[5]) if r[5] else None,
            title=r[6],
            description=r[7] or "",
            type=r[8] or "homework",
            total_points=float(r[9]),
            due_date=r[10].isoformat() if r[10] else None,
            calendar_event_id=str(r[11]) if r[11] else None,
            status=r[12] or "published",
            created_at=r[13].isoformat() if r[13] else "",
            total_students=int(r[14]),
            submitted_count=int(r[15]),
            graded_count=int(r[16]),
            pending_count=int(r[17]),
            avg_score=round(float(r[18]), 1) if r[18] is not None else None,
        ))
    return results


@router.post("/api/assignments", response_model=AssignmentSummaryOut, status_code=201)
def create_assignment(body: AssignmentIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        cal_event_id = None
        due_dt = None
        if body.due_date:
            try:
                due_dt = datetime.fromisoformat(body.due_date.replace("Z", "+00:00"))
            except Exception:
                due_dt = datetime.now(timezone.utc)

            if body.sync_calendar:
                cal_title = f"HW Due: {body.title} ({body.section_name})"
                cal_desc = f"{body.subject} assignment due. Points: {body.total_points}"
                ev_row = q(conn, """
                    INSERT INTO calendar_events (
                        tenant_id, user_id, title, description, event_type,
                        start_at, end_at, all_day, location
                    ) VALUES (
                        %s, %s, %s, %s, 'homework',
                        %s, %s, TRUE, 'Student Portal'
                    ) RETURNING id
                """, (tenant_id, uid, cal_title, cal_desc, due_dt.isoformat(), due_dt.isoformat())).fetchone()
                cal_event_id = str(ev_row[0])

        asg_row = q(conn, """
            INSERT INTO assignments (
                tenant_id, created_by, section_name, subject, lesson_plan_id,
                title, description, type, total_points, due_date, calendar_event_id, status
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            tenant_id, uid, body.section_name, body.subject, body.lesson_plan_id,
            body.title, body.description, body.type, body.total_points,
            due_dt, cal_event_id, body.status
        )).fetchone()
        asg_id = str(asg_row[0])

        # Auto-enroll tenant's students with 'pending' status
        students = q(conn, """
            SELECT u.id, u.full_name
            FROM users u
            JOIN user_tenant_mappings utm ON u.id = utm.user_id
            WHERE utm.tenant_id = %s AND utm.role = 'STUDENT'
            LIMIT 20
        """, (tenant_id,)).fetchall()

        for s_id, s_name in students:
            q(conn, """
                INSERT INTO assignment_submissions (
                    assignment_id, tenant_id, student_id, student_name, status
                ) VALUES (%s, %s, %s, %s, 'pending')
                ON CONFLICT (assignment_id, student_id) DO NOTHING
            """, (asg_id, tenant_id, s_id, s_name))

        conn.commit()

        summary = fetch_assignment_summary(conn, asg_id, tenant_id)
        if not summary:
            raise HTTPException(500, "Failed to retrieve created assignment")
        return summary


@router.get("/api/assignments/{assignment_id}", response_model=AssignmentDetailOut)
def get_assignment_detail(assignment_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        summary = fetch_assignment_summary(conn, assignment_id, tenant_id)
        if not summary:
            raise HTTPException(404, "Assignment not found")

        sub_rows = q(conn, """
            SELECT id, assignment_id, student_id, student_name, status, score, feedback, submitted_at, graded_at
            FROM assignment_submissions
            WHERE assignment_id = %s AND tenant_id = %s
            ORDER BY 
                CASE 
                    WHEN status = 'submitted' THEN 1
                    WHEN status = 'late' THEN 2
                    WHEN status = 'graded' THEN 3
                    ELSE 4
                END,
                student_name ASC
        """, (assignment_id, tenant_id)).fetchall()

        subs = []
        for s in sub_rows:
            subs.append(SubmissionOut(
                id=str(s[0]),
                assignment_id=str(s[1]),
                student_id=str(s[2]),
                student_name=s[3],
                status=s[4] or "pending",
                score=float(s[5]) if s[5] is not None else None,
                feedback=s[6] or "",
                submitted_at=s[7].isoformat() if s[7] else None,
                graded_at=s[8].isoformat() if s[8] else None,
            ))

    return AssignmentDetailOut(
        **summary.model_dump(),
        submissions=subs
    )


@router.put("/api/assignments/{assignment_id}", response_model=AssignmentSummaryOut)
def update_assignment(assignment_id: str, body: AssignmentUpdate, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        updates = []
        params = []
        if body.title is not None:
            updates.append("title = %s")
            params.append(body.title)
        if body.description is not None:
            updates.append("description = %s")
            params.append(body.description)
        if body.section_name is not None:
            updates.append("section_name = %s")
            params.append(body.section_name)
        if body.subject is not None:
            updates.append("subject = %s")
            params.append(body.subject)
        if body.type is not None:
            updates.append("type = %s")
            params.append(body.type)
        if body.total_points is not None:
            updates.append("total_points = %s")
            params.append(body.total_points)
        if body.due_date is not None:
            try:
                due_dt = datetime.fromisoformat(body.due_date.replace("Z", "+00:00"))
            except Exception:
                due_dt = None
            updates.append("due_date = %s")
            params.append(due_dt)
        if body.status is not None:
            updates.append("status = %s")
            params.append(body.status)

        if updates:
            updates.append("updated_at = NOW()")
            sql = f"UPDATE assignments SET {', '.join(updates)} WHERE id = %s AND tenant_id = %s"
            params.extend([assignment_id, tenant_id])
            q(conn, sql, tuple(params))
            conn.commit()

        summary = fetch_assignment_summary(conn, assignment_id, tenant_id)
        if not summary:
            raise HTTPException(404, "Assignment not found")
        return summary


@router.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, "SELECT calendar_event_id FROM assignments WHERE id = %s AND tenant_id = %s", (assignment_id, tenant_id)).fetchone()
        if not row:
            raise HTTPException(404, "Assignment not found")

        cal_id = row[0]
        q(conn, "DELETE FROM assignments WHERE id = %s AND tenant_id = %s", (assignment_id, tenant_id))
        if cal_id:
            q(conn, "DELETE FROM calendar_events WHERE id = %s AND tenant_id = %s", (cal_id, tenant_id))
        conn.commit()

    return {"status": "ok", "deleted_id": assignment_id}


@router.post("/api/assignments/{assignment_id}/grade", response_model=SubmissionOut)
def grade_submission(assignment_id: str, body: GradeSubmissionIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _ = single_tenant_or_raise(uid, CLASSROOM)

    with db() as conn:
        row = q(conn, """
            UPDATE assignment_submissions
            SET score = %s, feedback = %s, status = 'graded', graded_at = NOW(), updated_at = NOW()
            WHERE assignment_id = %s AND student_id = %s AND tenant_id = %s
            RETURNING id, assignment_id, student_id, student_name, status, score, feedback, submitted_at, graded_at
        """, (body.score, body.feedback, assignment_id, body.student_id, tenant_id)).fetchone()

        if not row:
            raise HTTPException(404, "Submission record not found for student")

        conn.commit()

    return SubmissionOut(
        id=str(row[0]),
        assignment_id=str(row[1]),
        student_id=str(row[2]),
        student_name=row[3],
        status=row[4],
        score=float(row[5]) if row[5] is not None else None,
        feedback=row[6] or "",
        submitted_at=row[7].isoformat() if row[7] else None,
        graded_at=row[8].isoformat() if row[8] else None,
    )
