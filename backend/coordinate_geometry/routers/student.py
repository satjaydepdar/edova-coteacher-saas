"""Coordinate Geometry has no edova-reasoner solver support yet (its solvers are
all Trigonometry-specific -- RIGHT_TRIANGLE_RATIOS, HEIGHTS_AND_DISTANCES, etc.;
an unrecognized problem_type there falls back to a placeholder that always
expects the answer "0", which would be a fake pass/fail, not a real one). So
unlike trigonometry/routers/student.py, this does NOT proxy to a reasoning
session -- it serves the curated problem + hints + worked solution directly and
is explicit that step-by-step interactive solving isn't wired up yet."""
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import Concept, StudentState, CoordGeoQuestion
from coordinate_geometry.schemas import ResetRequest

router = APIRouter(prefix="/api/coordgeo/student", tags=["Coordinate Geometry Student Workspace"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

@router.get("/state/{concept_id}")
def get_student_state(
    concept_id: str,
    generate_new: bool = Query(False, description="Whether to cycle to the next question in the bank"),
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

    questions = db.query(CoordGeoQuestion).filter(
        CoordGeoQuestion.concept_id == concept_id
    ).order_by(CoordGeoQuestion.id).all()

    selected: Optional[CoordGeoQuestion] = None
    if questions:
        if generate_new and state.current_question_id is not None:
            q_ids = [q.id for q in questions]
            try:
                curr_idx = q_ids.index(state.current_question_id)
                selected = questions[(curr_idx + 1) % len(questions)]
            except ValueError:
                selected = questions[0]
        else:
            matching = [q for q in questions if q.id == state.current_question_id]
            selected = matching[0] if matching else questions[0]

        state.current_question_id = selected.id
        db.commit()

    return {
        "concept_id": concept.id,
        "concept_title": concept.title,
        "difficulty": concept.difficulty,
        "formula_reference": concept.formula_reference,
        "mastery_score": round(state.mastery_score or 0.0, 2),
        "questions_solved": state.questions_solved or 0,
        "solving_available": False,
        "solving_unavailable_reason": (
            "Step-by-step interactive solving for Coordinate Geometry is coming soon. "
            "You can review the problem, hints, and worked solution below."
        ),
        "problem_title": selected.title if selected else None,
        "problem_text": selected.problem_text if selected else concept.description,
        "hints": selected.hints if selected else {},
        "worked_solution": selected.worked_solution if selected else [],
        "expected_answer": selected.expected_answer if selected else None,
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

    return {"message": f"Reset concept {req.concept_id} successfully."}
