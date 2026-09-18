"""Mirrors trigonometry/routers/student.py now that edova-reasoner has real
Coordinate Geometry solvers (see edova-reasoner/backend/app/services/solvers/
coordinate_geometry_solver.py). Curated questions carry a real problem_spec
(see seed_coordgeo_dag.py), so this proxies to a live reasoning session
instead of the earlier stub that only ever showed the answer key."""
import os
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import Concept, StudentState, CoordGeoQuestion
from coordinate_geometry.schemas import ResetRequest, CognitiveMetrics

REASONING_ENGINE_URL = os.getenv("REASONING_ENGINE_URL", "http://127.0.0.1:8000")

router = APIRouter(prefix="/api/coordgeo/student", tags=["Coordinate Geometry Student Workspace"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

# Active session cache: mirrors trigonometry/routers/student.py's ACTIVE_SESSION_PROBLEMS.
ACTIVE_SESSION_PROBLEMS: Dict[str, Dict[str, Any]] = {}

@router.get("/state/{concept_id}")
async def get_student_state(
    concept_id: str,
    fresh: bool = Query(False),
    generate_new: bool = Query(False),
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    p = current_principal(authorization)
    student_id = _student_id(p)

    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.concept_id == concept_id,
    ).first()
    if not state:
        state = StudentState(student_id=student_id, concept_id=concept_id)
        db.add(state)
        db.commit()
        db.refresh(state)
    elif fresh:
        state.mastery_score = 0.0
        state.questions_solved = 0
        state.current_question_id = None
        db.commit()
        db.refresh(state)

    session_key = f"{student_id}:{concept_id}"
    cached_session = ACTIVE_SESSION_PROBLEMS.get(session_key)

    questions = db.query(CoordGeoQuestion).filter(
        CoordGeoQuestion.concept_id == concept_id
    ).order_by(CoordGeoQuestion.id).all()

    current_qid = state.current_question_id or (cached_session.get("question_id") if cached_session else None)
    selected: Optional[CoordGeoQuestion] = None

    if questions:
        if generate_new and current_qid is not None:
            q_ids = [q.id for q in questions]
            try:
                curr_idx = q_ids.index(current_qid)
                selected = questions[(curr_idx + 1) % len(questions)]
            except ValueError:
                selected = questions[0]
        elif cached_session and not fresh and not generate_new:
            matching = [q for q in questions if q.id == current_qid]
            selected = matching[0] if matching else questions[0]
        else:
            selected = questions[0]
        problem_text = selected.problem_text
        question_id = selected.id
    else:
        problem_text = concept.description or f"Solve standard problems for {concept.title}."
        question_id = None

    existing_session_id = None if (fresh or generate_new) else (
        state.active_session_id or (cached_session.get("session_id") if cached_session else None)
    )
    reasoner_data = None

    async with httpx.AsyncClient(timeout=15.0) as client:
        if existing_session_id:
            try:
                res = await client.get(f"{REASONING_ENGINE_URL}/api/v1/session/{existing_session_id}")
                if res.status_code == 200:
                    reasoner_data = res.json()
            except Exception:
                reasoner_data = None

        if not reasoner_data:
            try:
                init_payload: Dict[str, Any] = {
                    "problem_text": problem_text,
                    "student_id": student_id,
                    "school_id": str(p.get("tenant_id") or "default_school"),
                    "initial_sal": 1.0,
                }
                if selected and selected.problem_spec:
                    init_payload["problem_spec"] = selected.problem_spec
                res = await client.post(f"{REASONING_ENGINE_URL}/api/v1/session/init", json=init_payload)
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
                    detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable.",
                )

    ACTIVE_SESSION_PROBLEMS[session_key] = {"question_id": question_id, "session_id": reasoner_data["session_id"]}
    state.current_question_id = question_id
    state.active_session_id = reasoner_data["session_id"]
    db.commit()

    active_step = reasoner_data.get("active_step") or {}
    metrics_data = reasoner_data.get("metrics") or {}
    metrics = CognitiveMetrics(
        assistance_sal=round(metrics_data.get("assistance_sal", 1.0), 2),
        concept_mastery=round(state.mastery_score or 0.0, 2),
        active_attempts=metrics_data.get("active_attempts", 0),
        accuracy_rate=round(metrics_data.get("accuracy_rate", 0.0), 2),
    )

    return {
        "session_id": reasoner_data["session_id"],
        "concept_id": concept.id,
        "concept_title": concept.title,
        "difficulty": concept.difficulty,
        "formula_reference": concept.formula_reference,
        "sal": metrics.assistance_sal,
        "mastery_score": round(state.mastery_score or 0.0, 2),
        "questions_solved": state.questions_solved or 0,
        "active_step_index": reasoner_data.get("active_step_index", 0),
        "total_steps": reasoner_data.get("total_steps", 0),
        "is_fully_solved": reasoner_data.get("is_fully_solved", False),
        "consecutive_correct": state.consecutive_correct or 0,
        "problem_context": reasoner_data.get("context", problem_text),
        "initial_state": reasoner_data.get("initial_state", ""),
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
    p = current_principal(authorization)
    student_id = _student_id(p)

    state = db.query(StudentState).filter(
        StudentState.student_id == student_id,
        StudentState.concept_id == req.concept_id,
    ).first()
    if state:
        state.mastery_score = 0.0
        state.questions_solved = 0
        state.current_question_id = None
        db.commit()

    ACTIVE_SESSION_PROBLEMS.pop(f"{student_id}:{req.concept_id}", None)
    return {"message": f"Reset concept {req.concept_id} successfully."}
