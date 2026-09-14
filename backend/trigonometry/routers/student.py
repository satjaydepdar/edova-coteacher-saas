import os
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import Concept, StudentState, TrigQuestion
from trigonometry.schemas import ResetRequest, CognitiveMetrics

REASONING_ENGINE_URL = os.getenv("REASONING_ENGINE_URL", "http://127.0.0.1:8000")

router = APIRouter(prefix="/api/trig/student", tags=["Trigonometry Student Workspace"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

def _school_id(p: dict) -> str:
    return str(p.get("tenant_id") or "default_school")

# Active session cache: { "student_id:concept_id": {"question_id": int, "session_id": str} }
ACTIVE_SESSION_PROBLEMS: Dict[str, Dict[str, Any]] = {}

@router.get("/state/{concept_id}")
async def get_student_state(
    concept_id: str,
    fresh: bool = Query(False, description="Whether to reset the concept to a fresh Step 1 session"),
    generate_new: bool = Query(False, description="Whether to fetch a new question from the question bank"),
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Retrieves or initializes the active student state and connects to edova-reasoner
    using curated problem statements stored in the trig_questions table.
    """
    p = current_principal(authorization)
    student_id = _student_id(p)
    school_id = _school_id(p)

    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.concept_id == concept_id
    ).first()

    if not state:
        state = StudentState(student_id=student_id, concept_id=concept_id)
        db.add(state)
        db.commit()
        db.refresh(state)
    elif fresh:
        state.active_step_index = 0
        state.mastery_score = 0.0
        state.scaffold_assistance_level = 1.0
        state.consecutive_correct = 0
        state.questions_solved = 0
        state.active_session_id = None
        state.current_question_id = None
        db.commit()
        db.refresh(state)
    elif generate_new:
        state.active_step_index = 0
        state.active_session_id = None
        db.commit()
        db.refresh(state)

    session_key = f"{student_id}:{concept_id}"
    cached_session = ACTIVE_SESSION_PROBLEMS.get(session_key)

    # 1. Select problem from trig_questions bank
    questions = db.query(TrigQuestion).filter(TrigQuestion.concept_id == concept_id).order_by(TrigQuestion.id).all()
    
    current_qid = state.current_question_id or (cached_session.get("question_id") if cached_session else None)
    selected_question: Optional[TrigQuestion] = None

    if questions:
        if generate_new and current_qid is not None:
            # Cycle to the next problem in the bank
            q_ids = [q.id for q in questions]
            try:
                curr_idx = q_ids.index(current_qid)
                selected_question = questions[(curr_idx + 1) % len(questions)]
            except ValueError:
                selected_question = questions[0]
        elif cached_session and not fresh and not generate_new:
            matching = [q for q in questions if q.id == current_qid]
            selected_question = matching[0] if matching else questions[0]
        else:
            selected_question = questions[0]

        problem_text = selected_question.problem_text
        question_id = selected_question.id
    else:
        # Fallback to concept.problem_data
        problem_data = concept.problem_data or {}
        problem_text = problem_data.get("context", f"Solve standard problems for {concept.title}.")
        question_id = None

    # 2. Check if we can resume an existing active reasoner session
    existing_session_id = (state.active_session_id or cached_session.get("session_id")) if (not fresh and not generate_new) else None
    reasoner_data = None

    async with httpx.AsyncClient(timeout=15.0) as client:
        if existing_session_id:
            try:
                res = await client.get(f"{REASONING_ENGINE_URL}/api/v1/session/{existing_session_id}")
                if res.status_code == 200:
                    reasoner_data = res.json()
            except Exception:
                reasoner_data = None

        # 3. If no active session, initialize a new session with edova-reasoner
        if not reasoner_data:
            try:
                init_payload = {
                    "problem_text": problem_text,
                    "student_id": student_id,
                    "school_id": school_id,
                    "initial_sal": state.scaffold_assistance_level
                }
                if selected_question and selected_question.problem_spec:
                    init_payload["problem_spec"] = selected_question.problem_spec

                res = await client.post(
                    f"{REASONING_ENGINE_URL}/api/v1/session/init",
                    json=init_payload
                )
                if res.status_code != 200:
                    detail = "Reasoning engine error"
                    try:
                        detail = res.json().get("detail", detail)
                    except Exception:
                        pass
                    raise HTTPException(status_code=res.status_code, detail=detail)
                reasoner_data = res.json()
            except httpx.RequestError:
                raise HTTPException(
                    status_code=503,
                    detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable. Please ensure it is running on port 8000."
                )

    ACTIVE_SESSION_PROBLEMS[session_key] = {
        "question_id": question_id,
        "session_id": reasoner_data["session_id"]
    }
    state.active_session_id = reasoner_data["session_id"]
    state.current_question_id = question_id
    state.active_step_index = reasoner_data.get("active_step_index", 0)
    db.commit()
    db.refresh(state)

    active_step = reasoner_data.get("active_step") or {}
    metrics_data = reasoner_data.get("metrics") or {}

    metrics = CognitiveMetrics(
        assistance_sal=round(metrics_data.get("assistance_sal", state.scaffold_assistance_level), 2),
        concept_mastery=round(state.mastery_score or 0.0, 2),
        active_attempts=metrics_data.get("active_attempts", 0),
        accuracy_rate=round(metrics_data.get("accuracy_rate", (state.cognitive_profile or {}).get("accuracy_rate", 0.0)), 2)
    )

    return {
        "session_id": reasoner_data["session_id"],
        "concept_id": concept.id,
        "concept_title": concept.title,
        "difficulty": concept.difficulty,
        "sal": metrics.assistance_sal,
        "mastery_score": round(state.mastery_score or 0.0, 2),
        "questions_solved": state.questions_solved or 0,
        "active_step_index": reasoner_data.get("active_step_index", 0),
        "total_steps": reasoner_data.get("total_steps", 0),
        "is_fully_solved": reasoner_data.get("is_fully_solved", False),
        "consecutive_correct": state.consecutive_correct,
        "problem_context": reasoner_data.get("context", problem_text),
        "initial_state": "",
        "formula_reference": concept.formula_reference,
        "working_equation": "",
        "current_step": active_step,
        "scaffold": active_step.get("hint", ""),
        "scaffold_strategy": "socratic",
        "quick_options": active_step.get("quick_options", []),
        "steps_history": reasoner_data.get("steps_history", []),
        "metrics": metrics,
        "required_items": [],
    }

@router.post("/reset")
def reset_student_concept(req: ResetRequest, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Resets student state to a clean slate Step 1."""
    p = current_principal(authorization)
    student_id = _student_id(p)

    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.concept_id == req.concept_id
    ).first()

    if state:
        state.active_step_index = 0
        state.mastery_score = 0.0
        state.scaffold_assistance_level = 1.0
        state.consecutive_correct = 0
        state.questions_solved = 0
        state.active_session_id = None
        state.current_question_id = None
        db.commit()

    session_key = f"{student_id}:{req.concept_id}"
    ACTIVE_SESSION_PROBLEMS.pop(session_key, None)

    return {"message": f"Reset concept {req.concept_id} successfully."}
