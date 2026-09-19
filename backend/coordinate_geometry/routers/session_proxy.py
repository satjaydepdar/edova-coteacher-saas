"""Mirrors trigonometry/routers/session_proxy.py. One real fix versus that
file: the mastery_events insert there hardcodes chapter_id="Introduction to
Trigonometry" regardless of which concept was actually completed (a
pre-existing bug, left alone there since trig wasn't in scope to touch) --
this looks up the concept's real chapter instead."""
import os
import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import StudentState, InteractionLog, TelemetryEvent, Concept
from services.problem_spec_classifier import classify_problem
from services.llm_client import LlmCallError

REASONING_ENGINE_URL = os.getenv("REASONING_ENGINE_URL", "http://127.0.0.1:8000")

router = APIRouter(prefix="/api/coordgeo/session", tags=["Coordinate Geometry Reasoning Engine Session Proxy"])

logger = logging.getLogger("edova.coordinate_geometry")


@router.post("/init")
async def init_session(payload: dict, authorization: str = Header(...), db: Session = Depends(get_db)):
    principal = current_principal(authorization)
    student_id = principal.get("user_id") or f"device:{principal.get('key_id')}"
    school_id = str(principal.get("tenant_id") or "default_school")

    forward_payload = {
        "problem_text": payload.get("problem_text"),
        "student_id": student_id,
        "school_id": school_id,
        "initial_sal": payload.get("initial_sal", 1.0),
    }
    if payload.get("problem_spec") is not None:
        forward_payload["problem_spec"] = payload.get("problem_spec")
    elif forward_payload["problem_text"]:
        try:
            forward_payload["problem_spec"] = classify_problem(forward_payload["problem_text"])
        except LlmCallError as exc:
            raise HTTPException(status_code=502, detail=f"Could not understand this problem statement: {exc}")

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(f"{REASONING_ENGINE_URL}/api/v1/session/init", json=forward_payload)
            if res.status_code != 200:
                detail = "Reasoning engine error"
                try:
                    detail = res.json().get("detail", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=res.status_code, detail=detail)
            data = res.json()

            concept_id = payload.get("concept_id")
            if concept_id:
                state = db.query(StudentState).filter(
                    StudentState.student_id == student_id,
                    StudentState.concept_id == concept_id,
                ).first()
                if state:
                    state.active_session_id = data.get("session_id")
                    db.commit()
            return data
        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable.",
            )


@router.post("/step")
async def submit_step(payload: dict, authorization: str = Header(...), db: Session = Depends(get_db)):
    principal = current_principal(authorization)
    student_id = principal.get("user_id") or f"device:{principal.get('key_id')}"

    session_id = payload.get("session_id")
    step_index = payload.get("step_index", 0)
    user_answer = payload.get("user_answer", "")
    response_time = float(payload.get("response_time") or 15.0)

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(f"{REASONING_ENGINE_URL}/api/v1/session/step", json=payload)
            if res.status_code != 200:
                detail = "Reasoning engine step error"
                try:
                    detail = res.json().get("detail", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=res.status_code, detail=detail)
            reasoner_res = res.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable.",
            )

    is_correct = bool(reasoner_res.get("is_correct", False))
    is_fully_solved = bool(reasoner_res.get("is_fully_solved", False))
    active_step_index = reasoner_res.get("active_step_index", step_index)
    metrics_data = reasoner_res.get("metrics") or {}
    updated_sal = float(metrics_data.get("assistance_sal", 1.0))
    diagnosed_prereq_node = reasoner_res.get("diagnosed_prereq_node")

    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.active_session_id == session_id,
    ).first()
    if not state:
        state = db.query(StudentState).filter(StudentState.student_id == student_id).order_by(
            StudentState.updated_at.desc()
        ).first()

    concept_id = state.concept_id if state else "coordgeo-c1"

    current_questions_solved = state.questions_solved if (state and state.questions_solved is not None) else 0
    if is_fully_solved:
        current_questions_solved += 1
        new_mastery = min(1.0, round(current_questions_solved / 5.0, 2))
    else:
        new_mastery = state.mastery_score if state else 0.0

    try:
        db.add(InteractionLog(
            student_id=student_id,
            concept_id=concept_id,
            step_index=step_index,
            raw_input=str(user_answer),
            step_score=1.0 if is_correct else 0.0,
            response_time=response_time,
            sal_at_step=updated_sal,
            mastery_at_step=new_mastery,
            timestamp=datetime.now(timezone.utc),
        ))

        # Diagnosed prerequisite-gap event (Reasoner DAG upgrade): when a wrong
        # answer traces back to a specific missing lower-grade skill, record it
        # as a "struggle" mastery_event -- reuses the same tenant-wide table and
        # error_detail field the "mastery" event below already writes, so the
        # existing teacher analytics page (StudentProfile) picks this up with
        # no new column or UI needed.
        if not is_correct and diagnosed_prereq_node:
            try:
                concept_for_gap = db.query(Concept).filter(Concept.id == concept_id).first()
                gap_chapter_name = concept_for_gap.chapter if concept_for_gap else "Coordinate Geometry"
                from core import db as get_raw_conn, q as execute_raw
                with get_raw_conn() as raw_conn:
                    execute_raw(raw_conn, """
                        INSERT INTO mastery_events
                        (classroom_id, student_id, student_name, chapter_id, concept_id, event_type, error_detail)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        str(principal.get("tenant_id") or "default_school"), student_id,
                        f"Student {student_id[:8]}", gap_chapter_name, concept_id, "struggle", diagnosed_prereq_node,
                    ))
            except Exception:
                pass

        if state:
            state.active_step_index = active_step_index
            state.scaffold_assistance_level = updated_sal
            state.consecutive_correct = metrics_data.get("consecutive_correct", (state.consecutive_correct or 0) + 1 if is_correct else 0)
            state.questions_solved = current_questions_solved
            state.mastery_score = new_mastery

            prof = dict(state.cognitive_profile or {})
            prof["total_attempts"] = prof.get("total_attempts", 0) + 1
            if is_correct:
                prof["correct_attempts"] = prof.get("correct_attempts", 0) + 1
            corr = prof.get("correct_attempts", 0)
            tot = prof.get("total_attempts", 1)
            prof["accuracy_rate"] = round(corr / max(1, tot), 2)
            state.cognitive_profile = prof

            if is_fully_solved:
                db.add(TelemetryEvent(
                    student_id=student_id,
                    concept_id=concept_id,
                    step_index=step_index,
                    event_type="problem_completed",
                    event_payload={"questions_solved": current_questions_solved, "mastery_score": new_mastery, "session_id": session_id},
                    timestamp=datetime.now(timezone.utc),
                ))
                if current_questions_solved >= 5:
                    db.add(TelemetryEvent(
                        student_id=student_id,
                        concept_id=concept_id,
                        step_index=step_index,
                        event_type="archetype_mastered",
                        event_payload={"concept_id": concept_id, "questions_solved": current_questions_solved, "mastery_score": 1.0},
                        timestamp=datetime.now(timezone.utc),
                    ))
                    try:
                        concept = db.query(Concept).filter(Concept.id == concept_id).first()
                        chapter_name = concept.chapter if concept else "Coordinate Geometry"
                        from core import db as get_raw_conn, q as execute_raw
                        with get_raw_conn() as raw_conn:
                            execute_raw(raw_conn, """
                                INSERT INTO mastery_events
                                (classroom_id, student_id, student_name, chapter_id, concept_id, event_type, error_detail)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """, (
                                str(principal.get("tenant_id") or "default_school"), student_id,
                                f"Student {student_id[:8]}", chapter_name, concept_id, "mastery", None,
                            ))
                    except Exception:
                        pass

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception(f"Failed to persist step analytics: {exc}")

    if "metrics" in reasoner_res:
        reasoner_res["metrics"]["concept_mastery"] = new_mastery
        reasoner_res["metrics"]["questions_solved"] = current_questions_solved

    return reasoner_res


@router.get("/{session_id}")
async def get_session(session_id: str, authorization: str = Header(...)):
    _ = current_principal(authorization)
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(f"{REASONING_ENGINE_URL}/api/v1/session/{session_id}")
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Session not found")
            return res.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable.",
            )
