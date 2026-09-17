"""Ported from edova-pilot-v4/backend/app/api/concepts.py.
Adapted: student_id comes from the verified auth token (current_principal),
never trusted from the request -- pilot-v4 took it as an optional query param."""
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import Concept, StudentState

router = APIRouter(prefix="/api/trig/concepts", tags=["Trigonometry Concepts"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"


def _topo_order(concepts: list[Concept]) -> list[Concept]:
    """Dependency order (prerequisites before dependents), not incidental row order."""
    by_id = {c.id: c for c in concepts}
    visited: set[str] = set()
    ordered: list[Concept] = []

    def visit(cid: str) -> None:
        if cid in visited or cid not in by_id:
            return
        visited.add(cid)
        for pr in by_id[cid].prerequisites:
            visit(pr.id)
        ordered.append(by_id[cid])

    for c in sorted(concepts, key=lambda c: c.id):
        visit(c.id)
    return ordered

@router.get("")
def list_concepts(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Returns all 10 CBSE Trigonometry DAG concepts, in dependency order, with unlock status for the caller."""
    p = current_principal(authorization)
    student_id = _student_id(p)
    concepts = _topo_order(db.query(Concept).all())

    states = db.query(StudentState).filter(StudentState.student_id == student_id).all()
    student_states = {s.concept_id: s for s in states}

    result = []
    for c in concepts:
        prereq_ids = [pr.id for pr in c.prerequisites]

        is_unlocked = True
        for pid in prereq_ids:
            p_state = student_states.get(pid)
            if not p_state or p_state.mastery_score < 0.7:
                is_unlocked = False
                break

        curr_state = student_states.get(c.id)
        mastery = curr_state.mastery_score if curr_state else 0.0
        sal = curr_state.scaffold_assistance_level if curr_state else 1.0

        result.append({
            "id": c.id,
            "title": c.title,
            "chapter": c.chapter,
            "difficulty": c.difficulty,
            "description": c.description,
            "formula_reference": c.formula_reference,
            "prerequisites": prereq_ids,
            "is_unlocked": is_unlocked,
            "is_completed": mastery >= 0.8,
            "mastery_score": round(mastery, 2),
            "sal": round(sal, 2)
        })

    return result

@router.get("/{concept_id}")
def get_concept(concept_id: str, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Fetches full details and problem sets for a specific concept."""
    current_principal(authorization)
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    return {
        "id": concept.id,
        "title": concept.title,
        "chapter": concept.chapter,
        "difficulty": concept.difficulty,
        "description": concept.description,
        "formula_reference": concept.formula_reference,
        "prerequisites": [p.id for p in concept.prerequisites],
        "problem_data": concept.problem_data
    }
