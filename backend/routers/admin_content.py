"""Router: extracted from main.py (pure code motion, no behavior change)."""
import os
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from fastapi import File, Form, UploadFile
from pathlib import Path as _Path
from psycopg.types.json import Jsonb
from services import s3_client
from routers.media_delivery import HLS_SEGMENT_SECONDS
import re as _re
import shutil as _shutil
import subprocess as _subprocess
import tempfile as _tempfile
import threading as _threading

from core import (
    DIFFICULTIES,
    authorize_subject_tenant,
    db,
    get_admin,
    q,
)

router = APIRouter()


def subject_tenant_of_module(conn, module_id: str):
    row = q(conn, "SELECT m.module_type, m.chapter_id, s.tenant_id FROM modules m "
                  "JOIN chapters c ON c.id = m.chapter_id JOIN subjects s ON s.id = c.subject_id "
                  "WHERE m.id = %s", (module_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "module not found")
    return row  # (module_type, chapter_id, subject_tenant_id)


# --- Endpoint 3: quiz config with dry-run COUNT (informational, never blocks) ---
class SelectionRulesIn(BaseModel):
    years: list = []          # loosely typed on purpose: handler validates and returns 400
    difficulty: str = ""      # (pydantic type errors would surface as FastAPI's 422, not the spec'd 400)
    total_questions: int = 0


class QuizConfigIn(BaseModel):
    selection_rules: SelectionRulesIn
    time_limit_minutes: int
    passing_percentage: int
    max_attempts: int | None = None


@router.post("/admin/modules/{module_id}/quiz-config")
def save_quiz_config(module_id: str, body: QuizConfigIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    rules = body.selection_rules
    # App-layer JSONB validation: 400 before touching the database (spec)
    if not rules.years or not all(isinstance(y, int) and 1900 <= y <= 2100 for y in rules.years):
        raise HTTPException(400, "selection_rules.years must be integers between 1900 and 2100")
    if rules.difficulty not in DIFFICULTIES:
        raise HTTPException(400, "selection_rules.difficulty must be EASY, MEDIUM, or HARD")
    if rules.total_questions <= 0:
        raise HTTPException(400, "selection_rules.total_questions must be a positive integer")
    if not (0 <= body.passing_percentage <= 100):
        raise HTTPException(400, "passing_percentage must be 0-100")
    if body.max_attempts is not None and body.max_attempts <= 0:
        raise HTTPException(400, "max_attempts must be positive or null")

    with db() as conn:
        mod_type, chapter_id, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        available = q(conn, "SELECT count(*) FROM question_bank "
                            "WHERE chapter_id = %s AND year = ANY(%s) AND difficulty = %s",
                      (chapter_id, rules.years, rules.difficulty)).fetchone()[0]
        q(conn, "INSERT INTO quiz_configurations "
                "(module_id, time_limit_minutes, passing_percentage, selection_rules, max_attempts) "
                "VALUES (%s, %s, %s, %s, %s) "
                "ON CONFLICT (module_id) DO UPDATE SET time_limit_minutes = EXCLUDED.time_limit_minutes, "
                "passing_percentage = EXCLUDED.passing_percentage, "
                "selection_rules = EXCLUDED.selection_rules, max_attempts = EXCLUDED.max_attempts",
          (module_id, body.time_limit_minutes, body.passing_percentage, Jsonb(rules.model_dump()),
           body.max_attempts))
    return {"saved": True, "available": available, "requested": rules.total_questions}


# --- Endpoint 4: video upload -> 202 -> background ffmpeg HLS transcode -> S3 ---
# The full-length lecture (~1GB) cannot transcode inside the HTTP request (P3 fix):
# the upload streams to disk, queues a daemon thread, and the CMS polls
# /admin/modules/{id}/video-status. Single-process thread queue is deliberate for
# MVP; the seam for a real worker (SQS/Celery) is _transcode_worker's signature.

# ffmpeg/ffprobe location: PATH by default (Docker image installs them); on dev
# machines without a system install, point EDOVA_FFMPEG_DIR at the bin folder, or
# fall back to the repo-bundled tools/ffmpeg/bin (same convention test_phase2_cms.py uses).
FFMPEG_DIR = os.getenv("EDOVA_FFMPEG_DIR", "")
_BUNDLED_FFMPEG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools", "ffmpeg", "bin")


def _tool(name: str) -> str:
    if FFMPEG_DIR:
        return os.path.join(FFMPEG_DIR, name)
    if _shutil.which(name) is not None:
        return name
    if _shutil.which(name, path=_BUNDLED_FFMPEG_DIR) is not None:
        return os.path.join(_BUNDLED_FFMPEG_DIR, name)
    return name


def _transcode_worker(module_id: str, workdir: str) -> None:
    """ffmpeg -> S3 -> video_payloads row. Owns its DB connection; never raises
    (failures land in transcode_status='FAILED' + transcode_error)."""
    tmp = _Path(workdir)
    try:
        src = tmp / "src.mp4"
        duration = 0
        try:
            probe = _subprocess.run(
                [_tool("ffprobe"), "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(src)],
                capture_output=True, text=True)
            if probe.returncode == 0 and probe.stdout.strip():
                duration = int(float(probe.stdout.strip()))
        except Exception:
            pass

        if duration <= 0:
            # Fallback duration probing using ffmpeg -i info banner
            probe_ff = _subprocess.run(
                [_tool("ffmpeg"), "-i", str(src)],
                capture_output=True, text=True, errors="replace")
            m = _re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", probe_ff.stderr)
            if m:
                duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(float(m.group(3)))

        proc = _subprocess.run(
            [_tool("ffmpeg"), "-y", "-i", str(src), "-c:v", "libx264", "-c:a", "aac",
             "-preset", "veryfast", "-f", "hls", "-hls_time", str(int(HLS_SEGMENT_SECONDS)),
             "-hls_playlist_type", "vod",
             "-hls_segment_filename", str(tmp / "seg_%03d.ts"), str(tmp / "out.m3u8")],
            capture_output=True)
        segments = sorted(tmp.glob("seg_*.ts"))
        if proc.returncode != 0 or not segments:
            raise RuntimeError(f"ffmpeg failed: {proc.stderr.decode(errors='replace')[-400:]}")
        prefix = f"uploads/hls/{module_id}/"
        for seg in segments:
            s3_client.put_bytes(prefix + seg.name, seg.read_bytes(), "video/mp2t")

        # Extract a preview thumbnail at 2s if possible
        thumb_path = tmp / "thumbnail.jpg"
        _subprocess.run(
            [_tool("ffmpeg"), "-y", "-ss", "00:00:02", "-i", str(src),
             "-vframes", "1", "-q:v", "2", str(thumb_path)],
            capture_output=True)
        if thumb_path.exists() and thumb_path.stat().st_size > 0:
            try:
                s3_client.put_bytes(prefix + "thumbnail.jpg", thumb_path.read_bytes(), "image/jpeg")
            except Exception:
                pass

        # NOTE: raw conn.execute, not q() — the query-count ContextVar only exists
        # in request threads; this worker runs outside any request context.
        with db() as conn:
            conn.execute("UPDATE video_payloads SET transcode_status = 'READY', transcode_error = NULL, "
                         "duration_seconds = %s, s3_key_prefix = %s WHERE module_id = %s",
                         (duration, prefix, module_id))
    except Exception as e:
        with db() as conn:
            conn.execute("UPDATE video_payloads SET transcode_status = 'FAILED', transcode_error = %s "
                         "WHERE module_id = %s", (str(e)[:500], module_id))
    finally:
        _shutil.rmtree(workdir, ignore_errors=True)


@router.post("/admin/modules/{module_id}/video-upload", status_code=202)
def video_upload(module_id: str, file: UploadFile = File(...), authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        mod_type, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "VIDEO":
            raise HTTPException(422, "module is not a video")

    # Stream to disk (never into memory — full lectures are ~1GB), then hand off.
    workdir = _tempfile.mkdtemp(prefix="edova_upload_")
    with open(_Path(workdir) / "src.mp4", "wb") as f:
        _shutil.copyfileobj(file.file, f, 1024 * 1024)

    with db() as conn:
        q(conn, "INSERT INTO video_payloads (module_id, transcode_status) VALUES (%s, 'PROCESSING') "
                "ON CONFLICT (module_id) DO UPDATE SET transcode_status = 'PROCESSING', "
                "transcode_error = NULL", (module_id,))
    _threading.Thread(target=_transcode_worker, args=(module_id, workdir), daemon=True).start()
    return {"accepted": True, "module_id": module_id, "status": "PROCESSING"}


@router.get("/admin/modules/{module_id}/video-status")
def video_status(module_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        _, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        row = q(conn, "SELECT transcode_status, transcode_error, duration_seconds, s3_key_prefix "
                      "FROM video_payloads WHERE module_id = %s", (module_id,)).fetchone()
    if row is None:
        return {"module_id": module_id, "status": "EMPTY"}  # never uploaded
    return {"module_id": module_id, "status": row[0], "error": row[1],
            "duration_seconds": row[2], "s3_key_prefix": row[3]}


# --- Endpoint 5: lab simulation upload -> S3 -> s3_file_key ---
@router.post("/admin/modules/{module_id}/lab-upload")
def lab_upload(module_id: str, file: UploadFile = File(...),
               environment_type: str = Form("VIRTUAL_LAB"),
               instructions_markdown: str = Form(""),
               authorization: str = Header(...)):
    admin = get_admin(authorization)
    # migration 015: one value for all uploaded sim files (any subject); the
    # per-language enum carried no behavior — the frontend treats it as opaque.
    if environment_type != "VIRTUAL_LAB":
        raise HTTPException(400, "invalid environment_type")
    filename = (file.filename or "").lower()
    if not (filename.endswith(".html") or filename.endswith(".svg")):
        raise HTTPException(400, "only .html or .svg simulation files are accepted")
    with db() as conn:
        mod_type, _, subj_tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, subj_tenant)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")

    key = f"uploads/labs/{module_id}/{file.filename}"
    content_type = "image/svg+xml" if filename.endswith(".svg") else "text/html"
    s3_client.put_bytes(key, file.file.read(), content_type)

    with db() as conn:
        q(conn, "INSERT INTO lab_payloads (module_id, environment_type, instructions_markdown, "
                "validation_rules, s3_file_key) VALUES (%s, %s, %s, '{}'::jsonb, %s) "
                "ON CONFLICT (module_id) DO UPDATE SET s3_file_key = EXCLUDED.s3_file_key, "
                "environment_type = EXCLUDED.environment_type, "
                "instructions_markdown = EXCLUDED.instructions_markdown",
          (module_id, environment_type, instructions_markdown, key))
    return {"saved": True, "module_id": module_id, "s3_file_key": key}


# --- Minimal content CRUD (create path; tree endpoint already covers read) ---
class SubjectIn(BaseModel):
    name: str
    standard_grade: str
    sequence_order: int
    thumbnail_url: str | None = None
    tenant_id: str | None = None  # None = global (platform only)


@router.post("/admin/subjects")
def create_subject(body: SubjectIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.tenant_id is None:
        if not admin["is_platform"]:
            raise HTTPException(403, "only platform admins create global subjects")
        tenant_id = None
    else:
        authorize_subject_tenant(admin, body.tenant_id)
        tenant_id = body.tenant_id
    with db() as conn:
        sid = q(conn, "INSERT INTO subjects (tenant_id, name, standard_grade, thumbnail_url, sequence_order) "
                      "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (tenant_id, body.name, body.standard_grade, body.thumbnail_url, body.sequence_order)).fetchone()[0]
    return {"id": str(sid)}


class ChapterIn(BaseModel):
    name: str
    sequence_order: int


@router.post("/admin/subjects/{subject_id}/chapters")
def create_chapter(subject_id: str, body: ChapterIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT tenant_id FROM subjects WHERE id = %s", (subject_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "subject not found")
        authorize_subject_tenant(admin, row[0])
        cid = q(conn, "INSERT INTO chapters (subject_id, name, sequence_order) VALUES (%s, %s, %s) RETURNING id",
                (subject_id, body.name, body.sequence_order)).fetchone()[0]
    return {"id": str(cid)}


class ModuleIn(BaseModel):
    title: str
    module_type: str
    sequence_order: int
    is_published: bool = False
    topic_id: str | None = None  # assign to a topic of the same chapter (migration 012)


@router.post("/admin/chapters/{chapter_id}/modules")
def create_module(chapter_id: str, body: ModuleIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.module_type not in ("VIDEO", "LAB", "QUIZ"):
        raise HTTPException(400, "module_type must be VIDEO, LAB, or QUIZ")
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        if body.topic_id is not None:
            trow = q(conn, "SELECT chapter_id FROM topics WHERE id = %s", (body.topic_id,)).fetchone()
            if trow is None or str(trow[0]) != chapter_id:
                raise HTTPException(422, "topic_id does not belong to this chapter")
        mid = q(conn, "INSERT INTO modules (chapter_id, topic_id, title, module_type, sequence_order, is_published) "
                      "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (chapter_id, body.topic_id, body.title, body.module_type,
                 body.sequence_order, body.is_published)).fetchone()[0]
    return {"id": str(mid)}


# --- Sections available for a chapter's tenant (Feature B Phase 1's Publish
# picker: which section(s) can a test in this chapter be assigned to). A chapter
# under a global (tenant_id NULL) subject has no single tenant's sections. ---
@router.get("/admin/chapters/{chapter_id}/sections")
def admin_chapter_sections(chapter_id: str, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        tenant_id = row[0] or admin.get("tenant_id")
        if tenant_id is None:
            return {"sections": []}
        rows = q(conn, "SELECT id, name, grade FROM sections WHERE tenant_id = %s ORDER BY name",
                 (tenant_id,)).fetchall()
    return {"sections": [{"id": str(r[0]), "name": r[1], "grade": r[2]} for r in rows]}


# --- Topics (requirement §3: Subject -> Chapter -> Topic -> Assets) ---
class TopicIn(BaseModel):
    name: str
    sequence_order: int


@router.post("/admin/chapters/{chapter_id}/topics", status_code=201)
def create_topic(chapter_id: str, body: TopicIn, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        row = q(conn, "SELECT s.tenant_id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                      "WHERE c.id = %s", (chapter_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "chapter not found")
        authorize_subject_tenant(admin, row[0])
        tid = q(conn, "INSERT INTO topics (chapter_id, name, sequence_order) VALUES (%s, %s, %s) "
                      "RETURNING id", (chapter_id, body.name, body.sequence_order)).fetchone()[0]
    return {"id": str(tid)}


def topic_tenant(conn, topic_id: str):
    row = q(conn, "SELECT t.chapter_id, s.tenant_id FROM topics t "
                  "JOIN chapters c ON c.id = t.chapter_id JOIN subjects s ON s.id = c.subject_id "
                  "WHERE t.id = %s", (topic_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "topic not found")
    return row  # (chapter_id, subject_tenant_id)


class TopicPatch(BaseModel):
    name: str | None = None
    sequence_order: int | None = None


@router.patch("/admin/topics/{topic_id}")
def update_topic(topic_id: str, body: TopicPatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    if body.name is None and body.sequence_order is None:
        raise HTTPException(400, "nothing to update")
    with db() as conn:
        _, tenant = topic_tenant(conn, topic_id)
        authorize_subject_tenant(admin, tenant)
        if body.name is not None:
            q(conn, "UPDATE topics SET name = %s WHERE id = %s", (body.name, topic_id))
        if body.sequence_order is not None:
            q(conn, "UPDATE topics SET sequence_order = %s WHERE id = %s",
              (body.sequence_order, topic_id))
    return {"id": topic_id, "updated": True}


@router.delete("/admin/topics/{topic_id}")
def delete_topic(topic_id: str, authorization: str = Header(...)):
    """Deletes the topic only; its modules fall back to the chapter's ungrouped bucket
    (ON DELETE SET NULL) — content is never lost with a topic."""
    admin = get_admin(authorization)
    with db() as conn:
        _, tenant = topic_tenant(conn, topic_id)
        authorize_subject_tenant(admin, tenant)
        q(conn, "DELETE FROM topics WHERE id = %s", (topic_id,))
    return {"id": topic_id, "deleted": True}


# --- Module patch: publish toggle, retitle, reorder, topic (re)assignment ---
class ModulePatch(BaseModel):
    title: str | None = None
    sequence_order: int | None = None
    is_published: bool | None = None
    topic_id: str | None = None  # explicit null un-assigns (back to ungrouped)


@router.patch("/admin/modules/{module_id}")
def update_module(module_id: str, body: ModulePatch, authorization: str = Header(...)):
    admin = get_admin(authorization)
    with db() as conn:
        mod_type, chapter_id, tenant = subject_tenant_of_module(conn, module_id)
        authorize_subject_tenant(admin, tenant)
        if body.topic_id is not None:
            trow = q(conn, "SELECT chapter_id FROM topics WHERE id = %s", (body.topic_id,)).fetchone()
            if trow is None or str(trow[0]) != str(chapter_id):
                raise HTTPException(422, "topic_id does not belong to this module's chapter")
        sets, params = [], []
        for col, val in (("title", body.title), ("sequence_order", body.sequence_order),
                         ("is_published", body.is_published), ("topic_id", body.topic_id)):
            if val is not None:
                sets.append(f"{col} = %s")
                params.append(val)
        if "topic_id" in body.model_fields_set and body.topic_id is None:
            sets.append("topic_id = NULL")
        if not sets:
            raise HTTPException(400, "nothing to update")
        q(conn, f"UPDATE modules SET {', '.join(sets)} WHERE id = %s", params + [module_id])
    return {"id": module_id, "updated": True}

