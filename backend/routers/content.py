"""Router: extracted from main.py (pure code motion, no behavior change)."""
from fastapi import APIRouter, Header, HTTPException, Query

from core import (
    current_principal,
    db,
    q,
)

router = APIRouter()


# Phase-3B flat tree query: subjects-driven LEFT JOINs, one round trip.
# No rows at all -> subject invisible to this tenant (404). chapter_id NULL -> no chapters yet.
# Topics (migration 012): modules group under their topic; topic_id NULL -> ungrouped bucket.
TREE_SQL = """
SELECT s.name AS subject_name,
       c.id AS chapter_id, c.name AS chapter_name, c.sequence_order AS chapter_seq,
       t.id AS topic_id, t.name AS topic_name, t.sequence_order AS topic_seq,
       m.id AS module_id, m.title AS module_title, m.module_type, m.sequence_order AS module_seq,
       vp.thumbnail_url
FROM subjects s
LEFT JOIN chapters c ON c.subject_id = s.id
LEFT JOIN modules m ON m.chapter_id = c.id AND m.is_published
LEFT JOIN topics t ON t.id = m.topic_id
LEFT JOIN video_payloads vp ON vp.module_id = m.id
WHERE s.id = %s AND (s.tenant_id IS NULL OR s.tenant_id = %s)
ORDER BY c.sequence_order, t.sequence_order NULLS LAST, m.sequence_order
"""


# --- Phase 3B content browsing tree ---
@router.get("/api/student/content/subjects/{subject_id}/tree")
def subject_tree(subject_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    flags = {"VIDEO": p["features"]["allow_video"], "LAB": p["features"]["allow_lab"],
             "QUIZ": p["features"]["allow_quiz"]}

    with db() as conn:
        rows = q(conn, TREE_SQL, (subject_id, tenant_id)).fetchall()
    if not rows:
        raise HTTPException(404, "subject not found")  # also covers cross-tenant (IDOR-safe)

    chapters: dict[str, dict] = {}
    for (_, ch_id, ch_name, ch_seq, t_id, t_name, t_seq,
         mod_id, mod_title, mod_type, mod_seq, thumb) in rows:
        if ch_id is None:
            continue
        chapter = chapters.setdefault(str(ch_id), {
            "chapter_id": str(ch_id), "chapter_name": ch_name, "sequence_order": ch_seq,
            "topics": {},  # keyed: topic id, or "" for ungrouped legacy modules
        })
        if mod_id is None:
            continue
        topic = chapter["topics"].setdefault(str(t_id) if t_id else "", {
            "topic_id": str(t_id) if t_id else None,
            "topic_name": t_name if t_id else None,  # NULL -> app renders "General"
            "sequence_order": t_seq if t_id else None,
            "modules": [],
        })
        topic["modules"].append({
            "module_id": str(mod_id),
            "title": mod_title,
            "type": mod_type,
            "sequence_order": mod_seq,
            "thumbnail_url": thumb,  # NULL -> React renders "Coming Soon"
            "locked": not flags.get(mod_type, False),
        })

    # Flatten topic maps; strip chapters with zero published modules (empty shells).
    # Content Shelf's own concern only -- Practice Questions has its own chapter list
    # (GET /api/student/practice/chapters) so it never needs this endpoint at all.
    visible = []
    for c in chapters.values():
        topics = sorted(c["topics"].values(),
                        key=lambda t: (t["sequence_order"] is None, t["sequence_order"] or 0))
        if any(t["modules"] for t in topics):
            visible.append({"chapter_id": c["chapter_id"], "chapter_name": c["chapter_name"],
                            "sequence_order": c["sequence_order"], "topics": topics})
    return {"subject_id": subject_id, "subject_name": rows[0][0], "chapters": visible}


# --- Practice Questions filter bar: Class -> Subject -> Chapter, global content only.
# Manual allowlist, not schema-driven: each entry names the frontend module that
# chapter's DAG/practice page is built from. Add a chapter here once its module ships.
PRACTICE_READY_CHAPTERS = {
    "Trigonometry": "trigonometry",
    "Coordinate Geometry": "coordinate_geometry",
}
# Chapters are ordered by curriculum sequence_order, not "how complete is the
# module" -- Coordinate Geometry (sequence 7) would otherwise beat Trigonometry
# (sequence 99, the only one with real step-by-step solving) as the page's
# default landing chapter. Pin the default explicitly instead.
DEFAULT_PRACTICE_CHAPTER = "Trigonometry"


@router.get("/api/student/practice/chapters")
def practice_chapters(authorization: str = Header(...)):
    current_principal(authorization)
    with db() as conn:
        rows = q(conn, """
            SELECT s.standard_grade, s.id, s.name, c.id, c.name, c.sequence_order
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id = s.id
            WHERE s.tenant_id IS NULL
            ORDER BY s.standard_grade, s.name, c.sequence_order NULLS LAST
        """).fetchall()

    classes: dict[str, dict] = {}
    for grade, subj_id, subj_name, ch_id, ch_name, _ in rows:
        subjects = classes.setdefault(grade, {})
        subject = subjects.setdefault(str(subj_id), {"id": str(subj_id), "name": subj_name, "chapters": []})
        if ch_id is not None:
            subject["chapters"].append({
                "id": str(ch_id),
                "name": ch_name,
                "practice_available": ch_name in PRACTICE_READY_CHAPTERS,
                "practice_module": PRACTICE_READY_CHAPTERS.get(ch_name),
                "is_default": ch_name == DEFAULT_PRACTICE_CHAPTER,
            })

    return {
        "classes": [
            {"grade": grade, "subjects": list(subjects.values())}
            for grade, subjects in sorted(classes.items())
        ]
    }


# --- Content endpoint: payload-level AuthZ independent of the sidebar ---
@router.get("/student/modules/{module_id}/lab")
def get_lab_payload(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    if not p["features"]["allow_lab"]:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        module = q(conn, "SELECT module_type FROM modules WHERE id = %s", (module_id,)).fetchone()
        if module is None or module[0] != "LAB":
            raise HTTPException(404, "lab module not found")
        payload = q(
            conn,
            "SELECT environment_type, instructions_markdown, initial_state_code, validation_rules "
            "FROM lab_payloads WHERE module_id = %s",
            (module_id,),
        ).fetchone()
    if payload is None:
        raise HTTPException(404, "lab content not published yet")  # "Coming Soon"
    return {
        "module_id": module_id,
        "environment_type": payload[0],
        "instructions_markdown": payload[1],
        "initial_state_code": payload[2],
        "validation_rules": payload[3],
    }

