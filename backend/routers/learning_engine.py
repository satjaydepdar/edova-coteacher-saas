"""Router: extracted from main.py (pure code motion, no behavior change)."""
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from psycopg.types.json import Jsonb

from core import (
    STUDENT_ONLY,
    current_principal,
    current_user_id,
    db,
    guarded_module,
    q,
    single_tenant_or_raise,
)

router = APIRouter()


# Phase 7: Grading engine (quiz generate/submit, lab submit, progress, review)
# Fixes vs the reviewed draft: module_type (uppercase) not m.type; config via
# quiz_configurations.module_id (reverse FK); tenant guard allows global
# content; served-set grading via quiz_generated_sets; advisory-lock
# concurrency; shortfall read from the persisted set row.
# ============================================================



def guarded_chapter(conn, chapter_id: str, tenant_id):
    row = q(conn, "SELECT s.id FROM chapters c JOIN subjects s ON s.id = c.subject_id "
                  "WHERE c.id = %s AND (s.tenant_id IS NULL OR s.tenant_id = %s)",
            (chapter_id, tenant_id)).fetchone()
    if row is None:
        raise HTTPException(404, "chapter not found")  # also cross-tenant (IDOR-safe)
    return row[0]  # subject_id


def _principal_clause(student_id, key_id):
    """One row per principal: student user OR classroom device key (migration 013).
    Used by upsert_progress / record_time_event / progress reads — keep in lockstep."""
    return ("student_id = %s", student_id) if student_id else ("activation_key_id = %s", key_id)


def upsert_progress(conn, module_id: str, new_pct, completion_met: bool,
                    student_id=None, key_id=None) -> bool:
    """State machine not_started -> in_progress -> completed; pct never regresses.
    Time is tracked separately via record_time_event (rollup of progress_events).
    Returns True if status changed."""
    where, pid = _principal_clause(student_id, key_id)
    existing = q(
        conn,
        f"SELECT status, progress_pct FROM student_progress WHERE {where} AND module_id = %s",
        (pid, module_id),
    ).fetchone()
    if existing is None:
        status = "completed" if completion_met else "in_progress"
        q(
            conn,
            "INSERT INTO student_progress "
            "(student_id, activation_key_id, module_id, status, progress_pct, time_spent, last_accessed, completed_at) "
            "VALUES (%s, %s, %s, %s, %s, 0, now(), CASE WHEN %s THEN now() ELSE NULL END)",
            (student_id, key_id, module_id, status, new_pct if new_pct is not None else 0, completion_met),
        )
        return True

    old_status, old_pct = existing
    final_pct = max(old_pct, new_pct) if new_pct is not None else old_pct
    new_status = "completed" if (old_status == "completed" or completion_met) else "in_progress"
    q(
        conn,
        f"UPDATE student_progress SET status = %s, progress_pct = %s, last_accessed = now(), "
        f"completed_at = CASE WHEN %s = 'completed' AND status <> 'completed' THEN now() ELSE completed_at END "
        f"WHERE {where} AND module_id = %s",
        (new_status, final_pct, new_status, pid, module_id),
    )
    return old_status != new_status


def record_time_event(conn, module_id: str, delta_seconds: int, event_id: str,
                      student_id=None, key_id=None) -> bool:
    """Append a time delta with an idempotency key; roll up only if the event
    actually landed. Returns True if counted, False if duplicate (or no-op).

    Callers: progress heartbeats use a client-generated UUID; quiz/lab submits
    use the attempt/submission id (structurally unique, retries impossible)."""
    if delta_seconds <= 0:
        return False
    inserted = q(
        conn,
        "INSERT INTO progress_events (student_id, activation_key_id, module_id, delta_seconds, client_event_id) "
        "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (client_event_id) DO NOTHING RETURNING id",
        (student_id, key_id, module_id, delta_seconds, event_id),
    ).fetchone()
    if inserted is None:
        return False  # duplicate heartbeat — counted once already
    where, pid = _principal_clause(student_id, key_id)
    q(conn, f"UPDATE student_progress SET time_spent = time_spent + %s WHERE {where} AND module_id = %s",
      (delta_seconds, pid, module_id))
    return True


# --- Practice Questions: fully independent of Content Shelf's subject_tree(). That
# endpoint's chapter list is scoped to published VIDEO/LAB/QUIZ modules only (its own
# concern); Practice Questions needs chapters that have a live question bank instead,
# which is a different, unrelated condition -- hence its own endpoint rather than a
# shared/overloaded one, so a change to either page can never leak into the other. ---
@router.get("/api/student/practice/chapters")
def practice_chapters(subject_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")
    with db() as conn:
        subj = q(conn, "SELECT tenant_id FROM subjects WHERE id = %s", (subject_id,)).fetchone()
        if subj is None or (subj[0] is not None and str(subj[0]) != str(p["tenant_id"])):
            raise HTTPException(404, "subject not found")
        rows = q(conn,
            "SELECT DISTINCT c.id, c.name, c.sequence_order FROM chapters c "
            "JOIN authored_questions aq ON aq.chapter_id = c.id AND aq.status != 'ARCHIVED' "
            "WHERE c.subject_id = %s ORDER BY c.sequence_order", (subject_id,)).fetchall()
    return {"chapters": [{"chapter_id": str(r[0]), "chapter_name": r[1], "sequence_order": r[2]} for r in rows]}


# --- Practice Questions: ad-hoc generation from authored_questions (the versioned
# Authoring Studio bank), scoped to subject+chapter with a caller-chosen count. No
# admin pre-configuration step needed, unlike the legacy quiz_configurations engine
# below. Ungraded/stateless by design -- nothing is persisted since there's no
# submit/grade flow for practice sets (unlike quiz_generated_sets). ---
class PracticeGenerateIn(BaseModel):
    subject_id: str
    chapter_id: str
    count: int


@router.post("/api/student/practice/generate")
def practice_generate(body: PracticeGenerateIn, authorization: str = Header(...)):
    p = current_principal(authorization)
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")
    if body.count <= 0:
        raise HTTPException(422, "count must be positive")

    with db() as conn:
        actual_subject_id = guarded_chapter(conn, body.chapter_id, p["tenant_id"])
        if str(actual_subject_id) != body.subject_id:
            raise HTTPException(404, "chapter not found")

        rows = q(conn,
            "SELECT v.id, v.question_type, v.question_text, v.options, v.marks, v.passage "
            "FROM authored_questions aq JOIN authored_question_versions v ON v.id = aq.current_version_id "
            "WHERE aq.chapter_id = %s AND aq.status != 'ARCHIVED' "
            "ORDER BY RANDOM() LIMIT %s",
            (body.chapter_id, body.count)).fetchall()

    delivered = len(rows)
    return {
        "questions": [
            {"version_id": str(r[0]), "question_type": r[1], "question_text": r[2],
             "options": [{"key": o["key"], "text": o["text"]} for o in r[3]], "marks": float(r[4]),
             "passage": r[5]}
            # correct flag and explanation deliberately withheld here -- explanation is
            # only released by practice_check, once the student has actually answered.
            for r in rows
        ],
        "metadata": {"total_requested": body.count, "total_delivered": delivered, "shortfall": delivered < body.count},
    }


class PracticeAnswerIn(BaseModel):
    version_id: str
    selected_key: str


class PracticeCheckIn(BaseModel):
    answers: list[PracticeAnswerIn]


@router.post("/api/student/practice/check")
def practice_check(body: PracticeCheckIn, authorization: str = Header(...)):
    p = current_principal(authorization)
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")

    version_ids = [a.version_id for a in body.answers]
    info_by_id = {}
    if version_ids:
        with db() as conn:
            rows = q(conn,
                "SELECT v.id, v.options, s.tenant_id, v.explanation FROM authored_question_versions v "
                "JOIN authored_questions aq ON aq.current_version_id = v.id "
                "JOIN chapters c ON c.id = aq.chapter_id JOIN subjects s ON s.id = c.subject_id "
                "WHERE v.id = ANY(%s)", (version_ids,)).fetchall()
        for vid, options, tenant_id, explanation in rows:
            if tenant_id is not None and str(tenant_id) != str(p["tenant_id"]):
                continue  # cross-tenant version_id -- drop silently, never leak its answer key
            correct_key = next((o["key"] for o in options if o.get("correct")), None)
            if correct_key is not None:
                info_by_id[str(vid)] = (correct_key, explanation)

    results = []
    for a in body.answers:
        info = info_by_id.get(a.version_id)
        if info is None:
            continue
        correct_key, explanation = info
        results.append({"version_id": a.version_id, "correct": a.selected_key == correct_key,
                        "correct_key": correct_key, "explanation": explanation})
    return {"results": results}


# --- Quiz generation (Phase 4 writer side: persists the served set) ---
class QuizGenerateIn(BaseModel):
    module_id: str


@router.post("/api/v1/engine/quiz/generate")
def quiz_generate(body: QuizGenerateIn, authorization: str = Header(...)):
    p = current_principal(authorization)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")
    with db() as conn:
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        cfg = q(conn, "SELECT selection_rules FROM quiz_configurations WHERE module_id = %s",
                (body.module_id,)).fetchone()
        if cfg is None:
            raise HTTPException(404, "quiz not configured yet")  # "Coming Soon"
        rules = cfg[0]
        years, difficulty, total = rules.get("years"), rules.get("difficulty"), rules.get("total_questions")
        if not (isinstance(years, list) and difficulty and isinstance(total, int) and total > 0):
            raise HTTPException(500, "malformed selection_rules in quiz configuration")

        rows = q(
            conn,
            "SELECT id, question_text, options, year, difficulty, content_hash FROM question_bank "
            "WHERE chapter_id = %s AND year = ANY(%s) AND difficulty = %s "
            "ORDER BY RANDOM() LIMIT %s",
            (chapter_id, years, difficulty, total),
        ).fetchall()
        served_ids = [str(r[0]) for r in rows]
        shortfall = len(rows) < total
        gen_id = q(
            conn,
            "INSERT INTO quiz_generated_sets (student_id, activation_key_id, module_id, question_ids, shortfall_flag) "
            "VALUES (%s, %s, %s, %s::uuid[], %s) RETURNING id",
            (p["user_id"], p["key_id"], body.module_id, served_ids, shortfall),
        ).fetchone()[0]

    return {
        "generation_id": str(gen_id),
        "module_id": body.module_id,
        "questions": [
            {"qid": str(r[0]), "question_text": r[1], "options": r[2],
             "year": r[3], "difficulty": r[4], "content_hash": r[5]}
            for r in rows
        ],  # correct_answer deliberately excluded
        "metadata": {"total_requested": total, "total_delivered": len(rows), "shortfall": shortfall},
    }


# --- Quiz submit (grades against the SERVED set, not the pool) ---
class QuizAnswerIn(BaseModel):
    qid: str
    selected_index: int | None = None


class QuizSubmitIn(BaseModel):
    module_id: str
    answers: list[QuizAnswerIn]
    time_spent: int = 0


@router.post("/api/student/quiz/submit")
def quiz_submit(body: QuizSubmitIn, authorization: str = Header(...)):
    p = current_principal(authorization, STUDENT_ONLY)  # teachers can't submit; device tokens can
    uid = p["user_id"]  # None for device tokens: grade but skip per-student persistence (deferred §17)
    tenant_id = p["tenant_id"]
    if not p["features"]["allow_quiz"]:
        raise HTTPException(403, "quiz access not included in your plan")

    with db() as conn:  # single transaction; advisory lock released at commit
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "QUIZ":
            raise HTTPException(422, "module is not a quiz")
        cfg = q(conn, "SELECT max_attempts FROM quiz_configurations WHERE module_id = %s",
                (body.module_id,)).fetchone()
        max_attempts = cfg[0] if cfg else None

        # Real serialization: per (principal, module) advisory xact lock, then recheck.
        lock_key = f"{uid or p['key_id']}:{body.module_id}"
        q(conn, "SELECT pg_advisory_xact_lock(hashtext(%s))", (lock_key,))
        if max_attempts is not None and uid is not None:
            used = q(conn, "SELECT count(*) FROM student_quiz_attempts WHERE student_id = %s AND module_id = %s",
                     (uid, body.module_id)).fetchone()[0]
            if used >= max_attempts:
                raise HTTPException(409, {
                    "error": "max_attempts_exceeded",
                    "attempts_used": used,
                    "max_attempts": max_attempts,
                })

        if uid is not None:
            gen = q(conn, "SELECT question_ids, shortfall_flag FROM quiz_generated_sets "
                          "WHERE student_id = %s AND module_id = %s ORDER BY created_at DESC LIMIT 1",
                    (uid, body.module_id)).fetchone()
        else:
            gen = q(conn, "SELECT question_ids, shortfall_flag FROM quiz_generated_sets "
                          "WHERE activation_key_id = %s AND module_id = %s ORDER BY created_at DESC LIMIT 1",
                    (p["key_id"], body.module_id)).fetchone()
        if gen is None:
            raise HTTPException(404, "no generated quiz found; call generate first")
        served = [str(x) for x in gen[0]]
        shortfall_flag = gen[1]  # persisted truth, not recomputed

        submitted = {a.qid for a in body.answers}
        extra = submitted - set(served)
        if extra:
            raise HTTPException(422, f"invalid question ids: {sorted(extra)}")

        rows = q(conn, "SELECT id, correct_answer FROM question_bank WHERE id = ANY(%s::uuid[])",
                 (served,)).fetchall()
        correct = {str(r[0]): (ord(r[1].upper()) - 65 if r[1] else None) for r in rows}

        ans_map = {a.qid: a.selected_index for a in body.answers}
        results, score = [], 0
        for qid in served:
            sel = ans_map.get(qid)  # unanswered served question -> incorrect
            ok = sel is not None and correct.get(qid) is not None and sel == correct[qid]
            score += ok
            results.append({"qid": qid, "selected_index": sel, "is_correct": ok})

        total = len(served)
        attempt_id = None
        if uid is not None:  # device principals: graded response only, no analytics rows
            attempt_id = q(
                conn,
                "INSERT INTO student_quiz_attempts "
                "(student_id, module_id, chapter_id, score, total_questions, time_spent, answers) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (uid, body.module_id, chapter_id, score, total, body.time_spent, Jsonb(results)),
            ).fetchone()[0]
            upsert_progress(conn, body.module_id, 100, completion_met=True, student_id=uid)
            # Attempt id doubles as the event's idempotency key: an attempt row is
            # inserted exactly once, so its time can never be double-counted.
            record_time_event(conn, body.module_id, body.time_spent, str(attempt_id), student_id=uid)

    return {
        "attempt_id": str(attempt_id) if attempt_id else None,
        "module_id": body.module_id,
        "score": score,
        "total_questions": total,
        "percentage": round(score / total * 100) if total else 0,
        "results": results,
        "shortfall_flag": shortfall_flag,
    }


# --- Lab submit (client-asserted completion, nothing to grade server-side) ---
class LabSubmitIn(BaseModel):
    module_id: str
    interaction_data: dict = {}
    completed: bool = False
    time_spent: int = 0


@router.post("/api/student/lab/submit")
def lab_submit(body: LabSubmitIn, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    tenant_id, _, _, _, allow_lab, _, _ = single_tenant_or_raise(uid)
    if not allow_lab:
        raise HTTPException(403, "lab access not included in your plan")
    with db() as conn:
        mod_type, chapter_id = guarded_module(conn, body.module_id, tenant_id)
        if mod_type != "LAB":
            raise HTTPException(422, "module is not a lab")
        submission_id = q(
            conn,
            "INSERT INTO student_lab_submissions "
            "(student_id, module_id, chapter_id, interaction_data, completed, time_spent) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (uid, body.module_id, chapter_id, Jsonb(body.interaction_data), body.completed, body.time_spent),
        ).fetchone()[0]
        upsert_progress(conn, body.module_id,
                        100 if body.completed else None,
                        completion_met=body.completed, student_id=uid)
        record_time_event(conn, body.module_id, body.time_spent, str(submission_id), student_id=uid)
    return {"submission_id": str(submission_id), "module_id": body.module_id, "completed": body.completed}


# --- Progress upsert (video: 90% threshold = completed; time = idempotent deltas) ---
class ProgressIn(BaseModel):
    module_id: str
    progress_pct: int
    time_spent_delta: int = 0      # seconds since the previous heartbeat, not a running total
    client_event_id: str = ""      # client-generated UUID per heartbeat; retries reuse it


@router.post("/api/student/progress")
def progress_update(body: ProgressIn, authorization: str = Header(...)):
    # Device tokens (MVP classroom app) persist per activation key; user JWTs per student.
    # STUDENT_ONLY: teachers can't write progress (same rule as quiz_submit).
    p = current_principal(authorization, STUDENT_ONLY)
    uid, key_id = p["user_id"], p["key_id"]
    flags = {"VIDEO": p["features"]["allow_video"], "LAB": p["features"]["allow_lab"],
             "QUIZ": p["features"]["allow_quiz"]}
    if not (0 <= body.progress_pct <= 100):
        raise HTTPException(422, "progress_pct must be 0-100")
    if body.time_spent_delta < 0:
        raise HTTPException(422, "time_spent_delta must be >= 0")
    if body.time_spent_delta > 0:
        try:
            UUID(body.client_event_id)
        except ValueError:
            raise HTTPException(422, "client_event_id must be a UUID when time_spent_delta > 0")
    with db() as conn:
        mod_type, _ = guarded_module(conn, body.module_id, p["tenant_id"])
        if not flags.get(mod_type, False):
            raise HTTPException(403, f"{mod_type.lower()} access not included in your plan")
        completion_met = mod_type == "VIDEO" and body.progress_pct >= 90
        upsert_progress(conn, body.module_id, body.progress_pct, completion_met,
                        student_id=uid, key_id=key_id)
        counted = record_time_event(conn, body.module_id, body.time_spent_delta,
                                    body.client_event_id, student_id=uid, key_id=key_id)
        where, pid = _principal_clause(uid, key_id)
        row = q(conn, f"SELECT status, progress_pct, time_spent FROM student_progress "
                      f"WHERE {where} AND module_id = %s", (pid, body.module_id)).fetchone()
    return {"module_id": body.module_id, "status": row[0], "progress_pct": row[1],
            "time_spent": row[2], "completed": row[0] == "completed",
            "time_counted": counted}  # False on duplicate heartbeat


# --- Progress read: resume position for the video player (pct * duration client-side) ---
@router.get("/api/student/progress/{module_id}")
def progress_read(module_id: str, authorization: str = Header(...)):
    p = current_principal(authorization)
    where, pid = _principal_clause(p["user_id"], p["key_id"])
    with db() as conn:
        mod_type, _ = guarded_module(conn, module_id, p["tenant_id"])
        row = q(conn, f"SELECT status, progress_pct, time_spent FROM student_progress "
                      f"WHERE {where} AND module_id = %s", (pid, module_id)).fetchone()
    if row is None:
        return {"module_id": module_id, "status": "not_started", "progress_pct": 0,
                "time_spent": 0, "completed": False}
    return {"module_id": module_id, "status": row[0], "progress_pct": row[1],
            "time_spent": row[2], "completed": row[0] == "completed"}


# --- Quiz review (correct_index derived from correct_answer letter at query time) ---
@router.get("/api/student/quiz/{attempt_id}/review")
def quiz_review(attempt_id: str, authorization: str = Header(...)):
    uid = current_user_id(authorization)
    with db() as conn:
        attempt = q(conn, "SELECT student_id, module_id, score, total_questions, submitted_at, answers "
                          "FROM student_quiz_attempts WHERE id = %s", (attempt_id,)).fetchone()
        if attempt is None or str(attempt[0]) != uid:
            raise HTTPException(404, "attempt not found")  # IDOR-safe, not 403
        answers = attempt[5]
        qids = [a["qid"] for a in answers]
        rows = q(conn, "SELECT id, question_text, options, correct_answer, explanation, "
                       "ASCII(UPPER(correct_answer)) - 65 AS correct_index "
                       "FROM question_bank WHERE id = ANY(%s::uuid[])", (qids,)).fetchall()
    qb = {str(r[0]): r for r in rows}
    return {
        "attempt_id": attempt_id,
        "module_id": str(attempt[1]),
        "score": attempt[2],
        "total_questions": attempt[3],
        "submitted_at": attempt[4].isoformat(),
        "questions": [
            {"qid": a["qid"],
             "question_text": qb[a["qid"]][1] if a["qid"] in qb else "",
             "options": qb[a["qid"]][2] if a["qid"] in qb else [],
             "selected_index": a["selected_index"],
             "correct_index": qb[a["qid"]][5] if a["qid"] in qb else None,
             "is_correct": a["is_correct"],
             "explanation": qb[a["qid"]][4] if a["qid"] in qb else None}
            for a in answers
        ],
    }

