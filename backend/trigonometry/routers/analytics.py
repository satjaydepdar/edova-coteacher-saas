"""Ported from edova-pilot-v4/backend/app/api/analytics.py.
Adapted: student_id comes from the verified auth token."""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import InteractionLog, StudentState, Concept

router = APIRouter(prefix="/api/trig/analytics", tags=["Trigonometry Analytics"])

def _student_id(p: dict) -> str:
    return p["user_id"] or f"device:{p['key_id']}"

@router.get("/progress/{concept_id}")
def get_progress_timeline(concept_id: str, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Returns chronological time-series data of student learning trajectory (Mastery vs. Assistance/SAL)."""
    p = current_principal(authorization)
    student_id = _student_id(p)

    logs = db.query(InteractionLog).filter(
        InteractionLog.student_id == student_id,
        InteractionLog.concept_id == concept_id
    ).order_by(InteractionLog.timestamp.asc()).all()

    if not logs:
        return [{"timestamp": "Start", "raw_score": 0.0, "estimated_mastery": 0.0, "assistance_level": 1.0, "step_index": 0}]

    return [
        {
            "timestamp": log.timestamp.strftime("%H:%M:%S"),
            "raw_score": log.step_score,
            "estimated_mastery": round(log.mastery_at_step, 2),
            "assistance_level": round(log.sal_at_step, 2),
            "step_index": log.step_index + 1,
            "response_time": log.response_time
        }
        for log in logs
    ]

@router.get("/profile")
def get_student_profile(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Calculates overall student cognitive mastery and performance stats."""
    p = current_principal(authorization)
    student_id = _student_id(p)

    states = db.query(StudentState).filter(StudentState.student_id == student_id).all()
    total_concepts = db.query(Concept).count()

    mastered_count = sum(1 for s in states if s.mastery_score >= 0.8)
    in_progress_count = sum(1 for s in states if 0.0 < s.mastery_score < 0.8)

    avg_sal = sum(s.scaffold_assistance_level for s in states) / max(1, len(states)) if states else 1.0
    avg_mastery = sum(s.mastery_score for s in states) / max(1, total_concepts)

    strengths, struggles = set(), set()
    total_attempts, total_accuracy = 0, 0.0
    for s in states:
        prof = s.cognitive_profile or {}
        strengths.update(prof.get("strengths", []))
        struggles.update(prof.get("struggles", []))
        total_attempts += prof.get("total_attempts", 0)
        total_accuracy += prof.get("accuracy_rate", 0.0)

    mean_accuracy = total_accuracy / max(1, len(states)) if states else 0.0

    return {
        "student_id": student_id,
        "mastered_concepts": mastered_count,
        "in_progress_concepts": in_progress_count,
        "total_concepts": total_concepts,
        "average_sal": round(avg_sal, 2),
        "average_mastery": round(avg_mastery, 2),
        "overall_accuracy": round(mean_accuracy * 100, 1),
        "total_attempts": total_attempts,
        "strengths": list(strengths),
        "struggles": list(struggles)
    }
