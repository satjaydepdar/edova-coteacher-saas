from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ConceptHeatmapNode(BaseModel):
    concept_id: str
    concept_name: str
    total_students_engaged: int
    mastered_count: int
    struggling_count: int
    mastery_percentage: float
    status: str = Field(..., description="mastered | in-progress | struggling-hotspot")
    top_misconception: Optional[str] = None
    remedial_recommendation: Optional[str] = None

class BottleneckAlert(BaseModel):
    concept_id: str
    concept_name: str
    struggling_percentage: float
    affected_students_count: int
    severity: str = Field("HIGH", description="HIGH | MEDIUM | LOW")
    teacher_action_hint: str

class StudentInterventionCard(BaseModel):
    student_id: str
    student_name: str
    stuck_concept_id: str
    stuck_concept_name: str
    attempts_count: int
    last_error_type: Optional[str] = None
    suggested_teacher_prompt: str

class ClassroomHeatmapResponse(BaseModel):
    classroom_id: str
    classroom_name: str
    chapter_id: str
    chapter_title: str
    total_active_students: int
    overall_chapter_mastery: float
    concept_heatmaps: List[ConceptHeatmapNode]
    bottleneck_alerts: List[BottleneckAlert]
    intervention_queue: List[StudentInterventionCard]
    section_roster_size: Optional[int] = None

class RecordMasteryRequest(BaseModel):
    classroom_id: str
    student_id: str
    student_name: Optional[str] = "Student"
    chapter_id: str
    concept_id: str
    event_type: str = Field(..., description="mastery | struggle | attempt")
    error_detail: Optional[str] = None
