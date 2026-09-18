"""Router: extracted from main.py (pure code motion, no behavior change)."""
import secrets
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from fastapi import File, Form, UploadFile
from pathlib import Path as _Path
from psycopg.types.json import Jsonb
from services import s3_client
from services import s3_client as _s3_client
from services.ai_classifier import AIClassificationError, classify_with_ai
import hashlib as _hashlib
import json as _json
import logging as _logging
import re as _re
import subprocess as _subprocess
import tempfile as _tempfile

from core import (
    DIFFICULTIES,
    authorize_subject_tenant,
    db,
    get_admin,
    q,
    sanitize_plain_text,
    sanitize_rich_text,
)

router = APIRouter()


# Phase 2: Admin CMS (/admin/*)
# AuthZ: role='ADMIN' in user_tenant_mappings. Platform admins (tenant type
# PLATFORM) manage everything incl. global content; school admins only their
# own tenant's subjects. Cross-tenant writes -> 403 (per spec).
# ============================================================








@router.get("/admin/session")
def admin_session(authorization: str = Header(...)):
    """CMS bootstrap: identity + scope for the logged-in admin. 403 for non-admins."""
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT u.email, u.full_name, t.name FROM users u, tenants t "
                      "WHERE u.id = %s AND t.id = %s", (admin["user_id"], admin["tenant_id"])).fetchone()
    return {"user_id": admin["user_id"], "email": row[0], "full_name": row[1],
            "tenant_id": str(admin["tenant_id"]), "tenant_name": row[2],
            "is_platform": admin["is_platform"], "role": admin.get("role", "ADMIN")}


def content_hash(subject_id: str, chapter_id: str, year: int, question_text: str) -> str:
    """Must match migration 003: SHA256(subject_id || chapter_id || year || question_text)."""
    return _hashlib.sha256(f"{subject_id}{chapter_id}{year}{question_text}".encode("utf-8")).hexdigest()


# --- Endpoint 1: bulk PYQ ingestion with hash dedupe ---
class PyqIn(BaseModel):
    subject_id: str
    chapter_id: str
    year: int
    difficulty: str
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str


class PyqBulkIn(BaseModel):
    questions: list[PyqIn]


@router.post("/admin/pyq/bulk")
def pyq_bulk(body: PyqBulkIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    # Batch-level tenant check: every chapter must be writable by this admin
    with db() as conn:
        for cid in {qs.chapter_id for qs in body.questions}:
            row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                          "WHERE c.id = %s", (cid,)).fetchone()
            if row is None:
                raise HTTPException(404, f"chapter not found: {cid}")
            authorize_subject_tenant(admin, row[0])

        inserted, invalid = 0, []
        for i, qs in enumerate(body.questions):
            if qs.difficulty not in DIFFICULTIES:
                invalid.append({"index": i, "error": f"invalid difficulty: {qs.difficulty}"})
                continue
            if not qs.question_text.strip() or len(qs.options) < 2:
                invalid.append({"index": i, "error": "empty question_text or fewer than 2 options"})
                continue
            letter = qs.correct_answer.strip().upper()
            if not ("A" <= letter <= chr(ord("A") + len(qs.options) - 1)):
                invalid.append({"index": i, "error": f"correct_answer '{qs.correct_answer}' out of option range"})
                continue
            row = q(conn, "INSERT INTO question_bank "
                          "(subject_id, chapter_id, year, difficulty, question_text, options, "
                          " correct_answer, explanation, content_hash) "
                          "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
                          "ON CONFLICT (content_hash) DO NOTHING RETURNING id",
                    (qs.subject_id, qs.chapter_id, qs.year, qs.difficulty, qs.question_text,
                     Jsonb(qs.options), letter, qs.explanation,
                     content_hash(qs.subject_id, qs.chapter_id, qs.year, qs.question_text))).fetchone()
            inserted += 1 if row else 0

    duplicates = len(body.questions) - inserted - len(invalid)
    return {"inserted": inserted, "duplicates_skipped": duplicates, "invalid": invalid}


# --- Endpoint 2: paginated pool browser ---
@router.get("/admin/pyq/pool")
def pyq_pool(chapter_id: str = Query(...), year: int | None = Query(None),
             difficulty: str | None = Query(None), limit: int = Query(50, le=200),
             offset: int = Query(0, ge=0), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        clauses, params = ["chapter_id = %s"], [chapter_id]
        if year is not None:
            clauses.append("year = %s"); params.append(year)
        if difficulty is not None:
            clauses.append("difficulty = %s"); params.append(difficulty)
        where = " AND ".join(clauses)
        total = q(conn, f"SELECT count(*) FROM question_bank WHERE {where}", params).fetchone()[0]
        rows = q(conn, f"SELECT id, year, difficulty, question_text, options, correct_answer, explanation "
                       f"FROM question_bank WHERE {where} ORDER BY year DESC, id LIMIT %s OFFSET %s",
                 params + [limit, offset]).fetchall()
    return {"total": total, "limit": limit, "offset": offset,
            "questions": [{"id": str(r[0]), "year": r[1], "difficulty": r[2], "question_text": r[3],
                           "options": r[4], "correct_answer": r[5], "explanation": r[6]} for r in rows]}


# --- Authored Questions (migration 018): versioned Question Bank for the Authoring
# Studio. Coexists with question_bank/pyq above (that feeds the quiz engine, untouched).
# Editing always creates a new version — it never mutates one in place. ---
QUESTION_TYPES = {
    "MCQ", "MCQ_COMBINATION", "ASSERTION_REASONING", "SHORT_ANSWER", "LONG_ANSWER",
    "FILL_IN_THE_BLANKS", "MATCH_THE_FOLLOWING", "NUMERICAL", "CASE_STUDY",
}

# Rich-text fields (question_text, option text, passage, explanation) are stored as
# HTML from the Authoring Studio's editor and later rendered client-side, so they're
# sanitized to this fixed allowlist on every write -- every consumer gets safe content
# by construction rather than trusting each render site to sanitize. Math is stored as
# an empty <span class="qmath" data-latex="..."> the editor's KaTeX renderer fills in
# client-side, never as KaTeX's own generated markup (too large/fragile to allowlist).




class OptionIn(BaseModel):
    key: str
    text: str
    correct: bool = False


class QuestionCreateIn(BaseModel):
    chapter_id: str
    question_type: str
    question_text: str
    marks: float = 1
    difficulty: str | None = None
    options: list[OptionIn] = []
    passage: str | None = None
    explanation: str | None = None
    topic_id: str | None = None
    source_papers: list[str] = []
    save_as_draft: bool = False


def _validate_topic_in_chapter(conn, topic_id: str, chapter_id: str):
    row = q(conn, "SELECT chapter_id FROM topics WHERE id = %s", (topic_id,)).fetchone()
    if row is None or str(row[0]) != str(chapter_id):
        raise HTTPException(422, "topic_id does not belong to this question's chapter")


@router.post("/admin/questions", status_code=201)
def create_authored_question(body: QuestionCreateIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.question_type not in QUESTION_TYPES:
        raise HTTPException(422, f"invalid question_type: {body.question_type}")
    if body.difficulty is not None and body.difficulty not in DIFFICULTIES:
        raise HTTPException(422, f"invalid difficulty: {body.difficulty}")
    if not body.save_as_draft and not body.question_text.strip():
        raise HTTPException(422, "question_text is required")

    question_text = sanitize_rich_text(body.question_text)
    passage = sanitize_rich_text(body.passage)
    explanation = sanitize_rich_text(body.explanation)
    options = [{**o.model_dump(), "text": sanitize_rich_text(o.text)} for o in body.options]
    source_papers = [sanitize_plain_text(s) for s in body.source_papers if sanitize_plain_text(s)]

    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (body.chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        if body.topic_id is not None:
            _validate_topic_in_chapter(conn, body.topic_id, body.chapter_id)

        qid = q(conn, "INSERT INTO authored_questions (chapter_id, created_by, topic_id, source_papers) "
                      "VALUES (%s, %s, %s, %s) RETURNING id",
                (body.chapter_id, admin["user_id"], body.topic_id, Jsonb(source_papers))).fetchone()[0]
        vid = q(conn, "INSERT INTO authored_question_versions "
                      "(question_id, version_no, question_type, question_text, marks, difficulty, options, "
                      " passage, explanation, created_by) "
                      "VALUES (%s, 1, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (qid, body.question_type, question_text, body.marks, body.difficulty,
                 Jsonb(options), passage, explanation, admin["user_id"])).fetchone()[0]
        q(conn, "UPDATE authored_questions SET current_version_id = %s WHERE id = %s", (vid, qid))

    return {"question_id": str(qid), "version_id": str(vid), "version_no": 1, "status": "DRAFT"}


@router.get("/admin/questions")
def list_authored_questions(chapter_id: str = Query(...), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])

        rows = q(conn,
            "SELECT aq.id, aq.status, v.id, v.version_no, v.question_type, v.question_text, "
            "       v.marks, v.difficulty, v.options, v.passage, v.explanation, "
            "       aq.topic_id, t.name, aq.source_papers "
            "FROM authored_questions aq JOIN authored_question_versions v ON v.id = aq.current_version_id "
            "LEFT JOIN topics t ON t.id = aq.topic_id "
            "WHERE aq.chapter_id = %s AND aq.status != 'ARCHIVED' ORDER BY aq.created_at DESC",
            (chapter_id,)).fetchall()

    return {"questions": [
        {"question_id": str(r[0]), "status": r[1], "version_id": str(r[2]), "version_no": r[3],
         "question_type": r[4], "question_text": r[5], "marks": float(r[6]), "difficulty": r[7],
         "options": r[8], "passage": r[9], "explanation": r[10],
         "topic_id": str(r[11]) if r[11] else None, "topic_name": r[12], "source_papers": r[13]}
        for r in rows
    ]}


class QuestionEditIn(BaseModel):
    question_type: str | None = None
    question_text: str | None = None
    marks: float | None = None
    difficulty: str | None = None
    options: list[OptionIn] | None = None
    passage: str | None = None
    explanation: str | None = None
    topic_id: str | None = None
    source_papers: list[str] | None = None


def _authored_question_or_404(conn, admin: dict, question_id: str):
    row = q(conn,
        "SELECT aq.chapter_id, s.tenant_id, v.version_no, v.question_type, v.question_text, "
        "       v.marks, v.difficulty, v.options, v.id, v.passage, v.explanation, "
        "       aq.topic_id, aq.source_papers "
        "FROM authored_questions aq "
        "JOIN chapters c ON c.id = aq.chapter_id JOIN subjects s ON s.id = c.subject_id "
        "JOIN authored_question_versions v ON v.id = aq.current_version_id "
        "WHERE aq.id = %s", (question_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "question not found")
    authorize_subject_tenant(admin, row[1])
    return row  # (chapter_id, tenant_id, version_no, question_type, question_text, marks, difficulty, options, version_id, passage, explanation, topic_id, source_papers)


@router.patch("/admin/questions/{question_id}")
def edit_authored_question(question_id: str, body: QuestionEditIn, authorization: str = Header(...)):
    """Content fields (text/marks/difficulty/options/passage/explanation) always
    create a new version — never mutate a published/prior version in place, so
    anything already pinned to the current version keeps its content. topic_id and
    source_papers are classification metadata on the question shell itself (same
    tier as chapter_id): updated in place, no version bump, and skipped entirely
    when nothing else changed either."""
    admin = get_admin(authorization)
    if body.question_type is not None and body.question_type not in QUESTION_TYPES:
        raise HTTPException(422, f"invalid question_type: {body.question_type}")
    if body.difficulty is not None and body.difficulty not in DIFFICULTIES:
        raise HTTPException(422, f"invalid difficulty: {body.difficulty}")

    content_changed = any(f is not None for f in (
        body.question_type, body.question_text, body.marks, body.difficulty, body.options,
        body.passage, body.explanation))

    with db() as conn:
        current = _authored_question_or_404(conn, admin, question_id)
        chapter_id = current[0]

        if body.topic_id is not None:
            _validate_topic_in_chapter(conn, body.topic_id, chapter_id)
            q(conn, "UPDATE authored_questions SET topic_id = %s WHERE id = %s", (body.topic_id, question_id))
        if body.source_papers is not None:
            source_papers = [sanitize_plain_text(s) for s in body.source_papers if sanitize_plain_text(s)]
            q(conn, "UPDATE authored_questions SET source_papers = %s WHERE id = %s",
              (Jsonb(source_papers), question_id))

        if not content_changed:
            return {"question_id": question_id, "version_id": str(current[8]), "version_no": current[2]}

        next_version_no = current[2] + 1
        question_type = body.question_type or current[3]
        question_text = sanitize_rich_text(body.question_text) if body.question_text is not None else current[4]
        marks = body.marks if body.marks is not None else current[5]
        difficulty = body.difficulty if body.difficulty is not None else current[6]
        options = [{**o.model_dump(), "text": sanitize_rich_text(o.text)} for o in body.options] \
            if body.options is not None else current[7]
        passage = sanitize_rich_text(body.passage) if body.passage is not None else current[9]
        explanation = sanitize_rich_text(body.explanation) if body.explanation is not None else current[10]

        vid = q(conn, "INSERT INTO authored_question_versions "
                      "(question_id, version_no, question_type, question_text, marks, difficulty, options, "
                      " passage, explanation, created_by) "
                      "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (question_id, next_version_no, question_type, question_text, marks, difficulty,
                 Jsonb(options), passage, explanation, admin["user_id"])).fetchone()[0]
        q(conn, "UPDATE authored_questions SET current_version_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
          (vid, question_id))

    return {"question_id": question_id, "version_id": str(vid), "version_no": next_version_no}


@router.get("/admin/questions/{question_id}/versions")
def list_authored_question_versions(question_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        _authored_question_or_404(conn, admin, question_id)
        rows = q(conn,
            "SELECT id, version_no, question_type, question_text, marks, difficulty, options, created_at, "
            "       passage, explanation "
            "FROM authored_question_versions WHERE question_id = %s ORDER BY version_no",
            (question_id,)).fetchall()
    return {"versions": [
        {"version_id": str(r[0]), "version_no": r[1], "question_type": r[2], "question_text": r[3],
         "marks": float(r[4]), "difficulty": r[5], "options": r[6], "created_at": r[7].isoformat(),
         "passage": r[8], "explanation": r[9]}
        for r in rows
    ]}


@router.delete("/admin/questions/{question_id}")
def delete_authored_question(question_id: str, authorization: str = Header(...)):
    """Soft-delete: archives the question rather than removing rows, so version
    history and anything already pinned to a version survive."""
    admin = get_admin(authorization)
    with db() as conn:
        _authored_question_or_404(conn, admin, question_id)
        q(conn, "UPDATE authored_questions SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
          (question_id,))
    return {"question_id": question_id, "status": "ARCHIVED"}


# --- Ingestion: bulk-create DRAFT questions from raw PDF-extracted records
# (llamaextract pipeline's questions_with_images.json shape). Best-effort
# classification: AI (OpenRouter) when requested, regex heuristic otherwise or
# on any AI failure — AI can never block ingestion. Reviewer cleanup happens
# afterwards through the normal DRAFT status. ---

_MCQ_OPTION_RE = _re.compile(r"\(([A-D])\)\s*([^()]*?)(?=\s*\([A-D]\)|$)", _re.DOTALL)


def _classify_heuristic(text: str) -> dict:
    options = [
        {"key": key, "text": value.strip(), "correct": False}
        for key, value in _MCQ_OPTION_RE.findall(text)
        if value.strip()
    ]
    question_type = "MCQ" if len(options) >= 2 else "SHORT_ANSWER"
    return {
        "question_type": question_type, "question_text": text, "difficulty": None,
        "options": options if question_type == "MCQ" else [], "method": "heuristic",
    }


def _classify_for_ingestion(text: str, use_ai: bool) -> dict:
    if use_ai:
        try:
            result = classify_with_ai(text)
            result["method"] = "ai"
            result["model"] = result.get("model_name")
            return result
        except AIClassificationError as exc:
            _logging.getLogger("edova.ingestion").warning(
                "AI classification failed, falling back to heuristic: %s", exc)
    return _classify_heuristic(text)


class IngestQuestionIn(BaseModel):
    question_no: int
    text: str
    images: list[str] = []


class IngestIn(BaseModel):
    chapter_id: str
    use_ai: bool = False
    questions: list[IngestQuestionIn]


@router.post("/admin/questions/ingest")
def ingest_questions(body: IngestIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (body.chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])

    # Classification (including any AI network calls) runs with no DB connection held open,
    # so a slow/large batch doesn't tie up a Postgres connection for the whole request.
    to_insert, skipped = [], []
    for item in body.questions:
        text = item.text.strip()
        if not text:
            skipped.append(item.question_no)
            continue
        classification = _classify_for_ingestion(text, body.use_ai)
        question_text = sanitize_rich_text(classification["question_text"])
        options = [{**o, "text": sanitize_rich_text(o["text"])} for o in classification["options"]]
        to_insert.append((item, classification, question_text, options))

    created = []
    with db() as conn:
        for item, classification, question_text, options in to_insert:
            qid = q(conn, "INSERT INTO authored_questions (chapter_id, created_by) VALUES (%s, %s) RETURNING id",
                    (body.chapter_id, admin["user_id"])).fetchone()[0]
            vid = q(conn, "INSERT INTO authored_question_versions "
                          "(question_id, version_no, question_type, question_text, marks, difficulty, options, created_by) "
                          "VALUES (%s, 1, %s, %s, 1, %s, %s, %s) RETURNING id",
                    (qid, classification["question_type"], question_text,
                     classification["difficulty"], Jsonb(options), admin["user_id"])).fetchone()[0]
            q(conn, "UPDATE authored_questions SET current_version_id = %s WHERE id = %s", (vid, qid))

            created.append({
                "question_no": item.question_no, "question_id": str(qid), "version_id": str(vid),
                "question_type": classification["question_type"], "option_count": len(options),
                "classification_method": classification["method"],
                "confidence": classification.get("confidence"),
            })

    return {"created": created, "skipped_question_numbers": skipped}


# --- Question media (migration 019): diagrams/images on a question's current
# version. Binary bytes go to S3 (s3_client.py, same bucket the CMS video/image
# uploads already use) — never into Postgres. ---


@router.post("/admin/questions/{question_id}/media", status_code=201)
async def upload_question_media(question_id: str, file: UploadFile, caption: str | None = Form(None),
                                 authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        current = _authored_question_or_404(conn, admin, question_id)
        version_id = current[8]

        data = await file.read()
        if not data:
            raise HTTPException(422, "empty file")

        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
        key = f"question-media/{version_id}/{secrets.token_hex(16)}.{ext}"
        content_type = file.content_type or "application/octet-stream"
        _s3_client.put_bytes(key, data, content_type)

        seq = q(conn, "SELECT count(*) FROM authored_question_media WHERE question_version_id = %s",
                (version_id,)).fetchone()[0]
        mid = q(conn, "INSERT INTO authored_question_media "
                      "(question_version_id, storage_key, file_name, mime_type, file_size, caption, "
                      " sequence_order, uploaded_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (version_id, key, file.filename or "upload", content_type, len(data), caption, seq,
                 admin["user_id"])).fetchone()[0]

    return {"media_id": str(mid), "storage_key": key, "url": _s3_client.presign_get(key)}


@router.get("/admin/questions/{question_id}/media")
def list_question_media(question_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        current = _authored_question_or_404(conn, admin, question_id)
        version_id = current[8]
        rows = q(conn, "SELECT id, storage_key, file_name, mime_type, file_size, caption, sequence_order "
                       "FROM authored_question_media WHERE question_version_id = %s ORDER BY sequence_order",
                 (version_id,)).fetchall()
    return {"media": [
        {"media_id": str(r[0]), "file_name": r[2], "mime_type": r[3], "file_size": r[4],
         "caption": r[5], "sequence_order": r[6], "url": _s3_client.presign_get(r[1])}
        for r in rows
    ]}
