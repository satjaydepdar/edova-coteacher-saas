"""Mirrors trigonometry/routers/teacher.py, trimmed to fields available here
(no error-rate/struggle heatmap since there's no per-step InteractionLog yet)."""
from fastapi import APIRouter, Header
from sqlalchemy.orm import Session
from fastapi import Depends

from core import current_principal
from coordinate_geometry.database import get_db
from coordinate_geometry.models import Concept, StudentState

router = APIRouter(prefix="/api/coordgeo/teacher", tags=["Coordinate Geometry Teacher Dashboard"])

@router.get("/overview")
def get_teacher_overview(authorization: str = Header(...), db: Session = Depends(get_db)):
    current_principal(authorization, roles=("TEACHER",))

    concepts = db.query(Concept).all()
    all_states = db.query(StudentState).all()
    unique_students = list(set(s.student_id for s in all_states))

    concept_stats = []
    for c in concepts:
        states_for_concept = [s for s in all_states if s.concept_id == c.id]
        avg_mastery = sum(s.mastery_score for s in states_for_concept) / max(1, len(states_for_concept)) if states_for_concept else 0.0
        concept_stats.append({
            "concept_id": c.id,
            "title": c.title,
            "difficulty": c.difficulty,
            "average_mastery": round(avg_mastery, 2),
            "students_attempted": len(states_for_concept),
        })

    student_roster = []
    for st_id in unique_students:
        s_states = [s for s in all_states if s.student_id == st_id]
        mastered = sum(1 for s in s_states if (s.mastery_score or 0.0) >= 0.8)
        avg_s_mastery = sum(s.mastery_score for s in s_states) / max(1, len(concepts))
        student_roster.append({
            "student_id": st_id,
            "mastered_concepts": mastered,
            "total_concepts": len(concepts),
            "readiness_score": round(avg_s_mastery * 100, 1),
        })

    return {
        "total_enrolled_students": len(unique_students),
        "total_dag_concepts": len(concepts),
        "concepts_analytics": concept_stats,
        "student_roster": student_roster,
        "average_class_mastery": round(sum(c["average_mastery"] for c in concept_stats) / max(1, len(concept_stats)) * 100, 1) if concept_stats else 0.0,
    }
