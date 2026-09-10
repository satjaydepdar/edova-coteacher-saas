import logging
from typing import Dict, List, Set, Optional, Any
from collections import defaultdict
from teacher_schemas import (
    ConceptHeatmapNode,
    BottleneckAlert,
    StudentInterventionCard,
    ClassroomHeatmapResponse,
    RecordMasteryRequest,
)
from kg_service import COMPILED_GRAPHS, find_and_load_all_graphs

logger = logging.getLogger("edova.teacher_analytics")

class TeacherAnalyticsService:
    """
    High-throughput in-memory classroom mastery aggregator and bottleneck detection engine.
    Computes real-time concept heatmaps across classrooms with sub-millisecond lookups.
    """

    def __init__(self):
        # Structure: classroom_id -> {
        #   "active_students": {student_id: student_name},
        #   "concept_mastery": {concept_id: Set[student_id]},
        #   "concept_struggling": {concept_id: Set[student_id]},
        #   "student_errors": {student_id: {concept_id: error_detail}}
        # }
        self._classroom_data: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "active_students": {},
            "concept_mastery": defaultdict(set),
            "concept_struggling": defaultdict(set),
            "student_errors": defaultdict(dict),
            "student_attempts": defaultdict(lambda: defaultdict(int))
        })

    def reset_classroom_state(self, classroom_id: str):
        if classroom_id in self._classroom_data:
            del self._classroom_data[classroom_id]

    def record_student_event(self, req: RecordMasteryRequest):
        data = self._classroom_data[req.classroom_id]
        data["active_students"][req.student_id] = req.student_name or req.student_id
        data["student_attempts"][req.student_id][req.concept_id] += 1

        if req.event_type == "mastery":
            data["concept_mastery"][req.concept_id].add(req.student_id)
            data["concept_struggling"][req.concept_id].discard(req.student_id)
        elif req.event_type == "struggle":
            data["concept_struggling"][req.concept_id].add(req.student_id)
            if req.error_detail:
                data["student_errors"][req.student_id][req.concept_id] = req.error_detail

    def get_classroom_heatmap(self, classroom_id: str, chapter_id: str) -> ClassroomHeatmapResponse:
        if not COMPILED_GRAPHS:
            find_and_load_all_graphs()

        graph = COMPILED_GRAPHS.get(chapter_id)
        chapter_title = graph.chapter_title if graph else "Chapter Learning Roadmap"

        data = self._classroom_data[classroom_id]
        active_students = data["active_students"]

        concept_heatmaps: List[ConceptHeatmapNode] = []
        bottleneck_alerts: List[BottleneckAlert] = []
        intervention_queue: List[StudentInterventionCard] = []

        nodes = graph.nodes if graph else {}
        total_mastered_points = 0

        for cid, node in nodes.items():
            mastered_set = data["concept_mastery"][cid]
            struggling_set = data["concept_struggling"][cid]

            mastered_count = len(mastered_set)
            struggling_count = len(struggling_set)
            total_engaged = max(1, mastered_count + struggling_count)

            mastery_pct = round((mastered_count / total_engaged) * 100, 1)
            struggling_pct = round((struggling_count / total_engaged) * 100, 1)

            if struggling_pct >= 30.0 and struggling_count > 0:
                status = "struggling-hotspot"
                bottleneck_alerts.append(
                    BottleneckAlert(
                        concept_id=cid,
                        concept_name=node.name,
                        struggling_percentage=struggling_pct,
                        affected_students_count=struggling_count,
                        severity="HIGH" if struggling_pct >= 50 else "MEDIUM",
                        teacher_action_hint=node.hermes_guiding_question or f"Review prerequisite building blocks for {node.name} with the class."
                    )
                )
            elif mastery_pct >= 70.0:
                status = "mastered"
                total_mastered_points += 1
            else:
                status = "in-progress"

            concept_heatmaps.append(
                ConceptHeatmapNode(
                    concept_id=cid,
                    concept_name=node.name,
                    total_students_engaged=total_engaged,
                    mastered_count=mastered_count,
                    struggling_count=struggling_count,
                    mastery_percentage=mastery_pct,
                    status=status,
                    top_misconception=node.common_pitfall,
                    remedial_recommendation=node.hermes_guiding_question
                )
            )

            for sid in struggling_set:
                sname = active_students.get(sid, sid)
                err = data["student_errors"].get(sid, {}).get(cid)
                attempts = data["student_attempts"].get(sid, {}).get(cid, 1)
                intervention_queue.append(
                    StudentInterventionCard(
                        student_id=sid,
                        student_name=sname,
                        stuck_concept_id=cid,
                        stuck_concept_name=node.name,
                        attempts_count=attempts,
                        last_error_type=err,
                        suggested_teacher_prompt=node.hermes_guiding_question or f"Guide student on {node.name}."
                    )
                )

        overall_mastery = round((total_mastered_points / max(1, len(nodes))) * 100, 1)

        return ClassroomHeatmapResponse(
            classroom_id=classroom_id,
            classroom_name=classroom_id.replace("-", " ").title(),
            chapter_id=chapter_id,
            chapter_title=chapter_title,
            total_active_students=len(active_students),
            overall_chapter_mastery=overall_mastery,
            concept_heatmaps=concept_heatmaps,
            bottleneck_alerts=bottleneck_alerts,
            intervention_queue=intervention_queue[:15]
        )

# Global Teacher Analytics Service Instance
teacher_analytics_service = TeacherAnalyticsService()
