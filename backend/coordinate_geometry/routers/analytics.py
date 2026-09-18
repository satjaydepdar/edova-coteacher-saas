"""Mirrors trigonometry/routers/analytics.py, trimmed to fields StudentState
actually has here (no per-step InteractionLog since there's no reasoner-driven
step submission yet -- see routers/student.py)."""
from fastapi import APIRouter, Header
from sqlalchemy.orm import Session
from fastapi import Depends

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import StudentState, Concept

router = APIRouter(prefix="/api/coordgeo/analytics", tags=["Coordinate Geometry Analytics"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

@router.get("/profile")
def get_student_profile(authorization: str = Header(...), db: Session = Depends(get_db)):
    p = current_principal(authorization)
    student_id = _student_id(p)

    states = db.query(StudentState).filter(StudentState.student_id == student_id).all()
    total_concepts = db.query(Concept).count()

    mastered_count = sum(1 for s in states if (s.mastery_score or 0.0) >= 0.8)
    in_progress_count = sum(1 for s in states if 0.0 < (s.mastery_score or 0.0) < 0.8)
    avg_mastery = sum(s.mastery_score for s in states) / max(1, total_concepts)

    return {
        "student_id": student_id,
        "mastered_concepts": mastered_count,
        "in_progress_concepts": in_progress_count,
        "total_concepts": total_concepts,
        "average_mastery": round(avg_mastery, 2),
    }
