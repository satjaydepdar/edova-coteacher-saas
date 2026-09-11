"""Ported from edova-pilot-v4/backend/app/api/student.py.

Adapted:
- student_id comes from the verified auth token, never a path/body param.
- The deprecated POST /submit endpoint is NOT ported. Tracing the actual
  current pilot-v4 frontend (CoteacherWorkspace.jsx) confirms step
  submission talks directly to the CoTeacher API, not this backend --
  pilot-v4's own PHASE-6C-MIGRATION-NOTES.md documents this migration and
  that /submit's only remaining caller was its own test suite. Porting a
  dead code path here would just add an unused sympy dependency.
- Known gap, carried over from the pilot rather than introduced by this
  port: because step submission bypasses this backend, StudentState/
  InteractionLog are not updated during a solve -- SAL/mastery/step
  progress lives in browser state + the CoTeacher session only, and does
  not currently survive a page refresh. Flagged, not silently fixed."""
import re
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import Concept, StudentState
from trigonometry.schemas import ResetRequest, StepHistoryItem, CognitiveMetrics
from trigonometry.engine import get_pedagogical_scaffold
from trigonometry.problem_generator import generate_dynamic_problem

router = APIRouter(prefix="/api/trig/student", tags=["Trigonometry Student Workspace"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

# Derives the CoTeacher reasoning session's completion target from data the
# problem already declares (the final step's expected_latex, e.g.
# "\sin(A) = \frac{7}{25}") -- never hardcoded per-concept here. Ported from
# pilot-v4's derive_required_items(); required by the (non-deprecated)
# frontend flow, which reads this field to seed the CoTeacher session.
RATIO_TARGET_RE = re.compile(r"\\?(sin|cos|tan|cot|sec|csc|cosec)\(\\?([A-Za-z]+)\)")

def derive_required_items(steps: list) -> List[Dict[str, str]]:
    if not steps:
        return []
    last_expected = steps[-1].get("expected_latex", "")
    m = RATIO_TARGET_RE.search(last_expected)
    if not m:
        return []
    ratio, angle = m.group(1), m.group(2)
    item_id = f"{ratio}_{angle}"
    return [{"id": item_id, "quantity": item_id}]

# Active session problems/derivations cache, keyed "student_id:concept_id" --
# same in-memory-cache design as the pilot (not durable across a restart;
# fine for a randomized "next problem" instance, same tradeoff it already had).
ACTIVE_SESSION_PROBLEMS: Dict[str, Dict[str, Any]] = {}

def build_steps_history(steps: list, active_step_index: int) -> List[StepHistoryItem]:
    history = []
    for s in steps:
        idx = s.get("step_index", 0)
        is_completed = idx < active_step_index
        result_str = s.get("expected_latex", s.get("expected_math", "")) if is_completed else ""
        history.append(StepHistoryItem(
            step_index=idx,
            instruction=s.get("prompt", ""),
            result=result_str,
            completed=is_completed
        ))
    return history

@router.get("/state/{concept_id}")
def get_student_state(
    concept_id: str,
    fresh: bool = Query(False, description="Whether to reset the concept to a fresh Step 1 session"),
    generate_new: bool = Query(False, description="Whether to generate a fresh randomized problem with new numbers"),
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Retrieves or initializes the active student state and next pedagogical scaffold for the concept."""
    p = current_principal(authorization)
    student_id = _student_id(p)

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
    elif fresh or generate_new:
        state.active_step_index = 0
        state.mastery_score = 0.0
        state.scaffold_assistance_level = 1.0
        state.consecutive_correct = 0
        db.commit()
        db.refresh(state)

    session_key = f"{student_id}:{concept_id}"

    if generate_new:
        dyn_prob = generate_dynamic_problem(concept_id)
        ACTIVE_SESSION_PROBLEMS[session_key] = dyn_prob if dyn_prob else (concept.problem_data or {})
    elif session_key not in ACTIVE_SESSION_PROBLEMS:
        ACTIVE_SESSION_PROBLEMS[session_key] = concept.problem_data or {}

    problem_data = ACTIVE_SESSION_PROBLEMS.get(session_key, concept.problem_data or {})
    steps = problem_data.get("steps", [])
    total_steps = len(steps)
    is_fully_solved = state.active_step_index >= total_steps and total_steps > 0

    current_step = steps[state.active_step_index] if not is_fully_solved and state.active_step_index < total_steps else None

    scaffold_info = {
        "scaffold": "Congratulations! You have completed all problem steps for this concept.",
        "strategy": "mastered",
        "quick_options": []
    }
    if current_step:
        scaffold_info = get_pedagogical_scaffold(
            concept_title=concept.title,
            context=problem_data.get("context", ""),
            current_prompt=current_step.get("prompt", ""),
            sal=state.scaffold_assistance_level,
            step_data=current_step
        )

    steps_history = build_steps_history(steps, state.active_step_index)

    metrics = CognitiveMetrics(
        assistance_sal=round(state.scaffold_assistance_level, 2),
        concept_mastery=round(state.mastery_score, 2),
        active_attempts=0,
        accuracy_rate=round((state.cognitive_profile or {}).get("accuracy_rate", 0.0), 2)
    )

    return {
        "concept_id": concept.id,
        "concept_title": concept.title,
        "difficulty": concept.difficulty,
        "sal": round(state.scaffold_assistance_level, 2),
        "mastery_score": round(state.mastery_score, 2),
        "active_step_index": state.active_step_index,
        "total_steps": total_steps,
        "is_fully_solved": is_fully_solved,
        "consecutive_correct": state.consecutive_correct,
        "problem_context": problem_data.get("context", ""),
        "initial_state": problem_data.get("initial_state", ""),
        "formula_reference": concept.formula_reference,
        "working_equation": problem_data.get("initial_state", ""),
        "current_step": current_step,
        "scaffold": scaffold_info["scaffold"],
        "scaffold_strategy": scaffold_info["strategy"],
        "quick_options": scaffold_info["quick_options"],
        "steps_history": steps_history,
        "metrics": metrics,
        "required_items": derive_required_items(steps),
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
        db.commit()

    session_key = f"{student_id}:{req.concept_id}"
    ACTIVE_SESSION_PROBLEMS.pop(session_key, None)

    return {"message": f"Reset concept {req.concept_id} successfully."}
