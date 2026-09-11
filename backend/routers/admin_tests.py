"""Router: extracted from main.py (pure code motion, no behavior change)."""
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from datetime import date as _date
from datetime import datetime as _datetime, timezone as _timezone

from core import (
    authorize_subject_tenant,
    current_principal,
    db,
    get_admin,
    q,
)

router = APIRouter()


# --- Published mock tests (migration 020): Create Test page's "Publish" action.
# Each question is pinned to the specific authored_question_versions row shown at
# publish time, so a later edit to that question never changes an already-published
# test — the same immutability guarantee as authored_questions itself. ---
class TestQuestionIn(BaseModel):
    version_id: str
    marks: float




class TestAssignmentIn(BaseModel):
    section_id: str | None = None  # None = tenant-wide (the device-token fallback -- no section identity)
    opens_at: _datetime
    closes_at: _datetime


class TestCreateIn(BaseModel):
    chapter_id: str
    title: str
    timer_minutes: int
    questions: list[TestQuestionIn]
    assignments: list[TestAssignmentIn] = []


@router.post("/admin/tests", status_code=201)
def publish_test(body: TestCreateIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if not body.title.strip():
        raise HTTPException(422, "title is required")
    if not body.questions:
        raise HTTPException(422, "at least one question is required")
    for a in body.assignments:
        if a.closes_at <= a.opens_at:
            raise HTTPException(422, "closes_at must be after opens_at")

    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (body.chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        tenant_id = row[0]

        version_ids = [item.version_id for item in body.questions]
        rows = q(conn, "SELECT v.id FROM authored_question_versions v "
                       "JOIN authored_questions aq ON aq.id = v.question_id "
                       "WHERE v.id = ANY(%s) AND aq.chapter_id = %s",
                 (version_ids, body.chapter_id)).fetchall()
        valid_ids = {str(r[0]) for r in rows}
        for vid in version_ids:
            if vid not in valid_ids:
                raise HTTPException(422, f"question version not found in this chapter: {vid}")

        section_ids = [a.section_id for a in body.assignments if a.section_id is not None]
        if section_ids:
            rows = q(conn, "SELECT id FROM sections WHERE id = ANY(%s) AND tenant_id = %s",
                     (section_ids, tenant_id)).fetchall()
            valid_section_ids = {str(r[0]) for r in rows}
            for sid in section_ids:
                if sid not in valid_section_ids:
                    raise HTTPException(422, f"section not found in this tenant: {sid}")

        total_marks = round(sum(item.marks for item in body.questions), 2)
        tid = q(conn, "INSERT INTO authored_tests (chapter_id, title, timer_minutes, total_marks, created_by) "
                      "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (body.chapter_id, body.title, body.timer_minutes, total_marks, admin["user_id"])).fetchone()[0]
        for i, item in enumerate(body.questions):
            q(conn, "INSERT INTO authored_test_questions (test_id, question_version_id, sequence_order, marks) "
                    "VALUES (%s, %s, %s, %s)", (tid, item.version_id, i, item.marks))
        for a in body.assignments:
            q(conn, "INSERT INTO authored_test_assignments (test_id, section_id, opens_at, closes_at) "
                    "VALUES (%s, %s, %s, %s)", (tid, a.section_id, a.opens_at, a.closes_at))

    return {"test_id": str(tid), "total_marks": total_marks, "question_count": len(body.questions)}


def caller_section_id(p: dict) -> str | None:
    """None for device-token callers (no individual identity at all) and for
    logged-in students with no section assigned yet -- both fall back to
    tenant-wide assignment visibility only."""
    if p["user_id"] is None:
        return None
    with db() as conn:
        row = q(conn, "SELECT section_id FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s",
                (p["user_id"], p["tenant_id"])).fetchone()
    return str(row[0]) if row and row[0] else None


def _test_status(opens_at, closes_at, now) -> str:
    if now < opens_at:
        return "UPCOMING"
    if now > closes_at:
        return "CLOSED"
    return "OPEN"


@router.get("/api/student/tests")
def list_student_tests(authorization: str = Header(...)):
    p = current_principal(authorization)
    section_id = caller_section_id(p)
    with db() as conn:
        rows = q(conn,
            "SELECT DISTINCT ON (t.id) t.id, t.title, t.timer_minutes, t.total_marks, "
            "       (SELECT count(*) FROM authored_test_questions tq WHERE tq.test_id = t.id), "
            "       c.name, s.name, ta.opens_at, ta.closes_at "
            "FROM authored_test_assignments ta "
            "JOIN authored_tests t ON t.id = ta.test_id "
            "JOIN chapters c ON c.id = t.chapter_id "
            "JOIN subjects s ON s.id = c.subject_id "
            "WHERE (s.tenant_id = %s OR s.tenant_id IS NULL) "
            "  AND (ta.section_id IS NULL OR ta.section_id = %s) "
            "ORDER BY t.id, (ta.section_id IS NULL) ASC, ta.opens_at DESC",
            (p["tenant_id"], section_id)).fetchall()

    now = _datetime.now(_timezone.utc)
    return {"tests": [
        {"test_id": str(r[0]), "title": r[1], "timer_minutes": r[2], "total_marks": float(r[3]),
         "question_count": r[4], "chapter_name": r[5], "subject_name": r[6],
         "opens_at": r[7].isoformat(), "closes_at": r[8].isoformat(),
         "status": _test_status(r[7], r[8], now)}
        for r in rows
    ]}


@router.get("/api/student/tests/{test_id}")
def get_student_test(test_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    section_id = caller_section_id(p)
    with db() as conn:
        test = q(conn, "SELECT t.title, t.timer_minutes, t.total_marks, s.tenant_id "
                       "FROM authored_tests t JOIN chapters c ON c.id = t.chapter_id "
                       "JOIN subjects s ON s.id = c.subject_id WHERE t.id = %s", (test_id,)).fetchone()
        if test is None:
            raise HTTPException(404, "test not found")
        if test[3] is not None and str(test[3]) != str(p["tenant_id"]):
            raise HTTPException(404, "test not found")  # IDOR-safe: 404, not 403

        assignment = q(conn,
            "SELECT opens_at, closes_at FROM authored_test_assignments "
            "WHERE test_id = %s AND (section_id IS NULL OR section_id = %s) "
            "ORDER BY (section_id IS NULL) ASC, opens_at DESC LIMIT 1",
            (test_id, section_id)).fetchone()
        if assignment is None:
            raise HTTPException(404, "test not found")  # not assigned to this caller at all

        now = _datetime.now(_timezone.utc)
        if now < assignment[0]:
            raise HTTPException(403, "test not open yet")
        if now > assignment[1]:
            raise HTTPException(403, "test is closed")

        rows = q(conn, "SELECT v.question_type, v.question_text, v.options, tq.marks, v.passage "
                       "FROM authored_test_questions tq JOIN authored_question_versions v ON v.id = tq.question_version_id "
                       "WHERE tq.test_id = %s ORDER BY tq.sequence_order", (test_id,)).fetchall()

    return {
        "test_id": test_id, "title": test[0], "timer_minutes": test[1], "total_marks": float(test[2]),
        "questions": [
            {"question_type": r[0], "question_text": r[1],
             "options": [{"key": o["key"], "text": o["text"]} for o in r[2]],
             "marks": float(r[3]), "passage": r[4]}
            # correct flag and explanation deliberately withheld -- same principle as practice_generate
            for r in rows
        ],
    }


@router.get("/admin/tests")
def list_tests(chapter_id: str = Query(...), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])

        rows = q(conn, "SELECT t.id, t.title, t.timer_minutes, t.total_marks, t.created_at, "
                       "       (SELECT count(*) FROM authored_test_questions tq WHERE tq.test_id = t.id) "
                       "FROM authored_tests t WHERE t.chapter_id = %s ORDER BY t.created_at DESC",
                 (chapter_id,)).fetchall()
    return {"tests": [
        {"test_id": str(r[0]), "title": r[1], "timer_minutes": r[2], "total_marks": float(r[3]),
         "created_at": r[4].isoformat(), "question_count": r[5]}
        for r in rows
    ]}


@router.get("/admin/tests/{test_id}")
def get_test(test_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        test = q(conn, "SELECT t.title, t.timer_minutes, t.total_marks, s.tenant_id, t.chapter_id "
                       "FROM authored_tests t JOIN chapters c ON c.id = t.chapter_id "
                       "JOIN subjects s ON s.id = c.subject_id WHERE t.id = %s", (test_id,)).fetchone()
        if test is None:
            raise HTTPException(404, "test not found")
        authorize_subject_tenant(admin, test[3])

        rows = q(conn, "SELECT v.question_type, v.question_text, v.options, tq.marks, v.passage, v.explanation "
                       "FROM authored_test_questions tq JOIN authored_question_versions v ON v.id = tq.question_version_id "
                       "WHERE tq.test_id = %s ORDER BY tq.sequence_order", (test_id,)).fetchall()
    return {
        "test_id": test_id, "title": test[0], "timer_minutes": test[1], "total_marks": float(test[2]),
        "chapter_id": str(test[4]),
        "questions": [
            {"question_type": r[0], "question_text": r[1], "options": r[2], "marks": float(r[3]),
             "passage": r[4], "explanation": r[5]}
            for r in rows
        ],
    }
