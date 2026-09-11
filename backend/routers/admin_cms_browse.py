"""Router: extracted from main.py (pure code motion, no behavior change)."""
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from datetime import date as _date

from core import (
    authorize_subject_tenant,
    db,
    get_admin,
    q,
)

router = APIRouter()


# Phase 2B: CMS gaps — subject/chapter edit+reorder, browse endpoints,
# school/subscription management, user management. AuthZ as Phase 2:
# platform admins everything; school admins only their own tenant.
# ============================================================



# --- Subject/chapter patch: rename + reorder (delete stays out on purpose:
# chapters cascade-delete modules; destructive ops need an explicit ask) ---
class SubjectPatch(BaseModel):
    name: str | None = None
    standard_grade: str | None = None
    thumbnail_url: str | None = None
    sequence_order: int | None = None


@router.patch("/admin/subjects/{subject_id}")
def update_subject(subject_id: str, body: SubjectPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT tenant_id FROM subjects WHERE id = %s", (subject_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "subject not found")
        authorize_subject_tenant(admin, row[0])
        sets, params = [], []
        for col, val in (("name", body.name), ("standard_grade", body.standard_grade),
                         ("thumbnail_url", body.thumbnail_url), ("sequence_order", body.sequence_order)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE subjects SET {', '.join(sets)} WHERE id = %s", params + [subject_id])
    return {"id": subject_id, "updated": True}


class ChapterPatch(BaseModel):
    name: str | None = None
    sequence_order: int | None = None


@router.patch("/admin/chapters/{chapter_id}")
def update_chapter(chapter_id: str, body: ChapterPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        sets, params = [], []
        for col, val in (("name", body.name), ("sequence_order", body.sequence_order)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE chapters SET {', '.join(sets)} WHERE id = %s", params + [chapter_id])
    return {"id": chapter_id, "updated": True}


# --- CMS browse: subject list (platform: all; school admin: own + global read-only) ---
@router.get("/admin/subjects")
def admin_list_subjects(authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        if admin["is_platform"]:
            rows = q(conn, "SELECT s.id, s.name, s.standard_grade, s.sequence_order, s.tenant_id, "
                           "t.name, (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id) "
                           "FROM subjects s LEFT JOIN tenants t ON t.id = s.tenant_id "
                           "ORDER BY s.tenant_id NULLS FIRST, s.sequence_order").fetchall()
        else:
            rows = q(conn, "SELECT s.id, s.name, s.standard_grade, s.sequence_order, s.tenant_id, "
                           "t.name, (SELECT count(*) FROM chapters c WHERE c.subject_id = s.id) "
                           "FROM subjects s LEFT JOIN tenants t ON t.id = s.tenant_id "
                           "WHERE s.tenant_id IS NULL OR s.tenant_id = %s "
                           "ORDER BY s.tenant_id NULLS FIRST, s.sequence_order",
                     (admin["tenant_id"],)).fetchall()
    return {"subjects": [
        {"id": str(r[0]), "name": r[1], "standard_grade": r[2], "sequence_order": r[3],
         "tenant_id": str(r[4]) if r[4] else None, "tenant_name": r[5],
         "scope": "global" if r[4] is None else "tenant",
         "read_only": not admin["is_platform"] and r[4] is None,
         "chapter_count": r[6]}
        for r in rows]}


# --- CMS browse: full editable tree (unlike the student tree: includes unpublished
# modules AND content-readiness flags so the CMS can show "Coming Soon" states) ---
@router.get("/admin/subjects/{subject_id}/tree")
def admin_subject_tree(subject_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        subj = q(conn, "SELECT name, standard_grade, tenant_id FROM subjects WHERE id = %s",
                 (subject_id,)).fetchone()
        if subj is None:
            raise HTTPException(404, "subject not found")
        if not admin["is_platform"] and subj[2] is not None and str(subj[2]) != str(admin["tenant_id"]):
            raise HTTPException(403, "cannot view content outside your tenant")
        # Two queries, not one chapters->topics->modules join: that join can only
        # attach an ungrouped module (topic_id NULL) to a topic row where t.id IS
        # NULL, which never happens for a chapter that has any topic at all — so
        # ungrouped modules silently vanished from every chapter with a topic.
        chapter_rows = q(conn, """
SELECT c.id, c.name, c.sequence_order, t.id, t.name, t.sequence_order
FROM chapters c
LEFT JOIN topics t ON t.chapter_id = c.id
WHERE c.subject_id = %s
ORDER BY c.sequence_order, t.sequence_order NULLS LAST
""", (subject_id,)).fetchall()

        module_rows = q(conn, """
SELECT c.id, m.topic_id, m.id, m.title, m.module_type, m.sequence_order, m.is_published,
       (vp.s3_key_prefix IS NOT NULL OR vp.hls_master_url IS NOT NULL) AS video_ready,
       (lp.s3_file_key IS NOT NULL) AS lab_ready,
       (qc.module_id IS NOT NULL) AS quiz_ready
FROM chapters c
JOIN modules m ON m.chapter_id = c.id
LEFT JOIN video_payloads vp ON vp.module_id = m.id
LEFT JOIN lab_payloads lp ON lp.module_id = m.id
LEFT JOIN quiz_configurations qc ON qc.module_id = m.id
WHERE c.subject_id = %s
ORDER BY m.sequence_order
""", (subject_id,)).fetchall()

    chapters: dict = {}
    for r in chapter_rows:
        ch = chapters.setdefault(r[0], {"id": str(r[0]), "name": r[1], "sequence_order": r[2],
                                        "topics": {}, "modules": []})
        if r[3] is not None:
            ch["topics"].setdefault(r[3], {"id": str(r[3]), "name": r[4],
                                           "sequence_order": r[5], "modules": []})

    for r in module_rows:
        ch = chapters[r[0]]
        mod = {"id": str(r[2]), "title": r[3], "module_type": r[4], "sequence_order": r[5],
               "is_published": r[6], "topic_id": str(r[1]) if r[1] else None,
               "content_ready": {"VIDEO": r[7], "LAB": r[8], "QUIZ": r[9]}[r[4]]}
        if r[1] is not None:
            ch["topics"][r[1]]["modules"].append(mod)
        else:
            ch["modules"].append(mod)  # ungrouped bucket (topic_id NULL)
    return {
        "subject": {"id": subject_id, "name": subj[0], "standard_grade": subj[1],
                    "scope": "global" if subj[2] is None else "tenant",
                    "read_only": not admin["is_platform"] and subj[2] is None},
        "chapters": [{**ch, "topics": sorted(ch["topics"].values(),
                                             key=lambda t: t["sequence_order"])}
                     for ch in chapters.values()],
    }
