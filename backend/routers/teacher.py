"""Router: extracted from main.py (pure code motion, no behavior change)."""
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


# --- Teacher subject shelf: global curriculum + own school's custom content ---
@router.get("/api/teacher/subjects")
def teacher_subjects(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, allow_video, allow_lab, allow_quiz, _tier = single_tenant_or_raise(uid, CLASSROOM)
    with db() as conn:
        rows = q(conn, "SELECT id, name, standard_grade, thumbnail_url, sequence_order FROM subjects "
                       "WHERE tenant_id IS NULL OR tenant_id = %s ORDER BY sequence_order", (tenant_id,)).fetchall()
    return {"subjects": [{"id": str(r[0]), "name": r[1], "standard_grade": r[2],
                          "thumbnail_url": r[3], "sequence_order": r[4]} for r in rows],
            "features": {"allow_video": allow_video, "allow_lab": allow_lab, "allow_quiz": allow_quiz}}


# --- Teacher class sections (migration 021): read-only listing for the analytics dashboard ---
@router.get("/api/teacher/sections")
def teacher_sections(authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER",))
    with db() as conn:
        rows = q(conn, "SELECT id, name, grade FROM sections WHERE tenant_id = %s ORDER BY name",
                 (tenant_id,)).fetchall()
    return [{"id": str(r[0]), "name": r[1], "grade": r[2]} for r in rows]


class SectionIn(BaseModel):
    name: str
    grade: str | None = None


@router.post("/api/teacher/sections", status_code=201)
def create_section(body: SectionIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER",))
    with db() as conn:
        if q(conn, "SELECT 1 FROM sections WHERE tenant_id = %s AND name = %s",
             (tenant_id, body.name)).fetchone() is not None:
            raise HTTPException(409, "a section with this name already exists")
        section_id = q(conn, "INSERT INTO sections (tenant_id, name, grade) VALUES (%s, %s, %s) RETURNING id",
                       (tenant_id, body.name, body.grade)).fetchone()[0]
    return {"id": str(section_id), "name": body.name, "grade": body.grade}


class SectionStudentIn(BaseModel):
    student_user_id: str


@router.post("/api/teacher/sections/{section_id}/students")
def assign_student_to_section(section_id: str, body: SectionStudentIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, _, _, _tier = single_tenant_or_raise(uid, ("TEACHER",))
    with db() as conn:
        if q(conn, "SELECT 1 FROM sections WHERE id = %s AND tenant_id = %s",
             (section_id, tenant_id)).fetchone() is None:
            raise HTTPException(404, "section not found")
        if q(conn, "SELECT 1 FROM user_tenant_mappings WHERE user_id = %s AND tenant_id = %s AND role = 'STUDENT'",
             (body.student_user_id, tenant_id)).fetchone() is None:
            raise HTTPException(404, "student not found in your tenant")
        q(conn, "UPDATE user_tenant_mappings SET section_id = %s WHERE user_id = %s AND tenant_id = %s",
          (section_id, body.student_user_id, tenant_id))
    return {"section_id": section_id, "student_user_id": body.student_user_id}
