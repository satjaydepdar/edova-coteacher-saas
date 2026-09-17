"""Ported from edova-pilot-v4/backend/app/api/teacher.py, unchanged logic --
this endpoint aggregates across all students already, no per-caller identity
to adapt. Access gate: any authenticated TEACHER, matching this app's own
current_principal(roles=...) convention elsewhere."""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from core import current_principal
from trigonometry.database import get_db
from trigonometry.models import Concept, StudentState, InteractionLog, TelemetryEvent

router = APIRouter(prefix="/api/trig/teacher", tags=["Trigonometry Teacher Dashboard"])

@router.get("/overview")
def get_teacher_overview(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Aggregates classroom-wide analytics, struggle heatmaps across DAG concepts, and student status."""
    current_principal(authorization, roles=("TEACHER",))

    concepts = db.query(Concept).all()
    all_states = db.query(StudentState).all()
    all_logs = db.query(InteractionLog).all()

    # Query video explainer telemetry events
    video_events = db.query(TelemetryEvent).filter(
        TelemetryEvent.event_type.in_(["video_explainer_generated", "video_explainer_watched"])
    ).order_by(TelemetryEvent.timestamp.desc()).all()

    unique_students = list(set(s.student_id for s in all_states))

    concept_stats = []
    for c in concepts:
        states_for_concept = [s for s in all_states if s.concept_id == c.id]
        logs_for_concept = [l for l in all_logs if l.concept_id == c.id]
        concept_video_events = [e for e in video_events if e.concept_id == c.id]

        avg_mastery = sum(s.mastery_score for s in states_for_concept) / max(1, len(states_for_concept)) if states_for_concept else 0.0
        avg_sal = sum(s.scaffold_assistance_level for s in states_for_concept) / max(1, len(states_for_concept)) if states_for_concept else 1.0

        total_attempts = len(logs_for_concept)
        wrong_attempts = sum(1 for l in logs_for_concept if l.step_score < 0.8)
        error_rate = (wrong_attempts / total_attempts) if total_attempts > 0 else 0.0
        is_struggling = error_rate > 0.35 or avg_sal > 0.75

        concept_stats.append({
            "concept_id": c.id,
            "title": c.title,
            "difficulty": c.difficulty,
            "average_mastery": round(avg_mastery, 2),
            "average_sal": round(avg_sal, 2),
            "total_attempts": total_attempts,
            "error_rate": round(error_rate * 100, 1),
            "needs_intervention": is_struggling,
            "video_explainer_count": len([e for e in concept_video_events if e.event_type == "video_explainer_generated"]),
        })

    student_roster = []
    for st_id in unique_students:
        s_states = [s for s in all_states if s.student_id == st_id]
        mastered = sum(1 for s in s_states if (getattr(s, 'questions_solved', 0) or 0) >= 5 or (s.mastery_score or 0.0) >= 1.0)
        avg_s_mastery = sum(s.mastery_score for s in s_states) / max(1, len(concepts))

        st_video_events = [e for e in video_events if e.student_id == st_id]
        videos_requested = sum(1 for e in st_video_events if e.event_type == "video_explainer_generated")
        recent_videos = [
            {
                "video_id": (e.event_payload or {}).get("video_id"),
                "concept_id": e.concept_id,
                "problem_context": (e.event_payload or {}).get("problem_context"),
                "timestamp": e.timestamp.isoformat(),
            }
            for e in st_video_events[:3]
        ]

        student_roster.append({
            "student_id": st_id,
            "mastered_concepts": mastered,
            "total_concepts": len(concepts),
            "readiness_score": round(avg_s_mastery * 100, 1),
            "status": "On Track" if avg_s_mastery >= 0.5 else "Needs Scaffolding Support",
            "video_explainers_requested": videos_requested,
            "used_video_scaffolding": videos_requested > 0,
            "recent_videos": recent_videos,
        })

    total_gen = sum(1 for e in video_events if e.event_type == "video_explainer_generated")

    return {
        "total_enrolled_students": len(unique_students),
        "total_dag_concepts": len(concepts),
        "total_video_explainers_generated": total_gen,
        "concepts_analytics": concept_stats,
        "student_roster": student_roster,
        "top_struggle_concept": next((c["title"] for c in concept_stats if c["needs_intervention"]), None),
        "average_class_mastery": round(sum(c["average_mastery"] for c in concept_stats) / max(1, len(concept_stats)) * 100, 1) if concept_stats else 0.0
    }

