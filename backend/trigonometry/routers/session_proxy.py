import os
import httpx
from fastapi import APIRouter, Header, HTTPException
from core import current_principal

REASONING_ENGINE_URL = os.getenv("REASONING_ENGINE_URL", "http://127.0.0.1:8000")

router = APIRouter(prefix="/api/trig/session", tags=["Trigonometry Reasoning Engine Session Proxy"])

from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from fastapi import Depends

from trigonometry.database import get_db
from trigonometry.models import StudentState, InteractionLog, TelemetryEvent

logger = logging.getLogger("edova.trigonometry")

@router.post("/init")
async def init_session(
    payload: dict,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Proxies problem initialization to the dedicated Neuro-Symbolic Reasoning Engine Service (edova-reasoner).
    Automatically derives student_id and school_id from verified JWT token.
    """
    principal = current_principal(authorization)
    student_id = principal.get("user_id") or f"device:{principal.get('key_id')}"
    school_id = str(principal.get("tenant_id") or "default_school")
    
    forward_payload = {
        "problem_text": payload.get("problem_text"),
        "student_id": student_id,
        "school_id": school_id,
        "initial_sal": payload.get("initial_sal", 1.0)
    }
    if payload.get("problem_spec") is not None:
        forward_payload["problem_spec"] = payload.get("problem_spec")
    
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
            
            # If concept_id was sent in init payload, associate active session immediately
            concept_id = payload.get("concept_id")
            if concept_id:
                state = db.query(StudentState).filter(
                    StudentState.student_id == student_id,
                    StudentState.concept_id == concept_id
                ).first()
                if state:
                    state.active_session_id = data.get("session_id")
                    db.commit()
            return data
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503, 
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable. Please ensure it is running on port 8000."
            )

@router.post("/step")
async def submit_step(
    payload: dict,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Proxies step submission to edova-reasoner, evaluates mathematical equivalence,
    and persists step analytics, SAL adjustments, and the 5-question archetype mastery rule
    into PostgreSQL tables (trig_student_states, trig_interaction_logs, trig_telemetry_events, mastery_events).
    """
    principal = current_principal(authorization)
    student_id = principal.get("user_id") or f"device:{principal.get('key_id')}"
    school_id = str(principal.get("tenant_id") or "default_school")

    session_id = payload.get("session_id")
    step_index = payload.get("step_index", 0)
    user_answer = payload.get("user_answer", "")
    response_time = float(payload.get("response_time") or 15.0)

    # 1. Forward step to edova-reasoner
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
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable."
            )

    # 2. Extract reasoner output metrics
    is_correct = bool(reasoner_res.get("is_correct", False))
    is_fully_solved = bool(reasoner_res.get("is_fully_solved", False))
    active_step_index = reasoner_res.get("active_step_index", step_index)
    metrics_data = reasoner_res.get("metrics") or {}
    updated_sal = float(metrics_data.get("assistance_sal", 1.0))

    # 3. Locate student state in PostgreSQL
    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.active_session_id == session_id
    ).first()

    if not state:
        state = db.query(StudentState).filter(
            StudentState.student_id == student_id
        ).order_by(StudentState.updated_at.desc()).first()

    concept_id = state.concept_id if state else "trig-101"

    # 4. Apply 5-Question Archetype Mastery Rule
    current_questions_solved = state.questions_solved if (state and state.questions_solved is not None) else 0
    if is_fully_solved:
        current_questions_solved += 1
        new_mastery = min(1.0, round(current_questions_solved / 5.0, 2))
    else:
        new_mastery = state.mastery_score if state else 0.0

    # 5. Persist to PostgreSQL tables
    try:
        # Interaction log entry (attempt history)
        log_entry = InteractionLog(
            student_id=student_id,
            concept_id=concept_id,
            step_index=step_index,
            raw_input=str(user_answer),
            step_score=1.0 if is_correct else 0.0,
            response_time=response_time,
            sal_at_step=updated_sal,
            mastery_at_step=new_mastery,
            strategy_used="socratic",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(log_entry)

        # Update StudentState
        if state:
            state.active_step_index = active_step_index
            state.scaffold_assistance_level = updated_sal
            state.consecutive_correct = metrics_data.get("consecutive_correct", state.consecutive_correct + 1 if is_correct else 0)
            state.questions_solved = current_questions_solved
            state.mastery_score = new_mastery

            # Update cognitive profile
            prof = dict(state.cognitive_profile or {})
            prof["total_attempts"] = prof.get("total_attempts", 0) + 1
            if is_correct:
                prof["correct_attempts"] = prof.get("correct_attempts", 0) + 1
            corr = prof.get("correct_attempts", 0)
            tot = prof.get("total_attempts", 1)
            prof["accuracy_rate"] = round(corr / max(1, tot), 2)
            prof["questions_solved"] = current_questions_solved
            state.cognitive_profile = prof

            # Telemetry Event on problem completion
            if is_fully_solved:
                telemetry_event = TelemetryEvent(
                    student_id=student_id,
                    concept_id=concept_id,
                    step_index=step_index,
                    event_type="problem_completed",
                    event_payload={
                        "questions_solved": current_questions_solved,
                        "mastery_score": new_mastery,
                        "sal": updated_sal,
                        "session_id": session_id
                    },
                    timestamp=datetime.now(timezone.utc)
                )
                db.add(telemetry_event)

                # Archetype Mastered milestone (at 5 questions)
                if current_questions_solved >= 5:
                    mastered_event = TelemetryEvent(
                        student_id=student_id,
                        concept_id=concept_id,
                        step_index=step_index,
                        event_type="archetype_mastered",
                        event_payload={
                            "concept_id": concept_id,
                            "questions_solved": current_questions_solved,
                            "mastery_score": 1.0
                        },
                        timestamp=datetime.now(timezone.utc)
                    )
                    db.add(mastered_event)

                    # Also persist to tenant-wide mastery_events table for DuckDB rollups
                    try:
                        from core import db as get_raw_conn, q as execute_raw
                        with get_raw_conn() as raw_conn:
                            execute_raw(raw_conn, """
                                INSERT INTO mastery_events
                                (classroom_id, student_id, student_name, chapter_id, concept_id, event_type, error_detail)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """, (school_id, student_id, f"Student {student_id[:8]}", "Introduction to Trigonometry", concept_id, "mastery", None))
                    except Exception:
                        pass

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception(f"Failed to persist step analytics to PostgreSQL: {exc}")

    # 6. Enrich returned metrics with archetype mastery & questions_solved
    if "metrics" in reasoner_res:
        reasoner_res["metrics"]["concept_mastery"] = new_mastery
        reasoner_res["metrics"]["questions_solved"] = current_questions_solved

    return reasoner_res

@router.get("/{session_id}")
async def get_session(session_id: str, authorization: str = Header(...)):
    """
    Fetches active session state from the Reasoning Engine Service.
    """
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
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable."
            )
