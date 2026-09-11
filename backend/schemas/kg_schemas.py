from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ConceptNode(BaseModel):
    id: str = Field(..., description="Unique concept identifier, e.g., AP-01, TRIG-02")
    name: str = Field(..., description="Human-readable concept name")
    topic: str = Field(..., description="Chapter or topic hierarchy, e.g., Maths > Ch 5: Arithmetic Progressions")
    learning_goal: str = Field(..., description="One-sentence learning outcome")
    prerequisites: List[str] = Field(default_factory=list, description="List of prerequisite Concept IDs or concept names")
    unlocks_next: List[str] = Field(default_factory=list, description="List of downstream Concept IDs or concept names")
    common_pitfall: Optional[str] = Field(None, description="Common student misconception or mistake")
    hermes_guiding_question: Optional[str] = Field(None, description="Socratic remedial prompt for Hermes")
    key_formula: Optional[str] = Field(None, description="Mathematical formula or core rule")

class GraphValidationResult(BaseModel):
    is_valid: bool
    total_nodes: int = 0
    total_edges: int = 0
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    topological_order: List[str] = Field(default_factory=list)

class ChapterKnowledgeGraph(BaseModel):
    subject_id: str
    subject_name: str
    chapter_id: str
    chapter_number: int
    chapter_title: str
    grade_level: Optional[str] = None
    version: str = "1.0.0"
    total_concepts: int
    nodes: Dict[str, ConceptNode] = Field(default_factory=dict)
    adjacency_list: Dict[str, List[str]] = Field(default_factory=dict, description="node_id -> list of downstream concept IDs")
    reverse_adjacency: Dict[str, List[str]] = Field(default_factory=dict, description="node_id -> list of prerequisite concept IDs")
    topological_order: List[str] = Field(default_factory=list)
    validation: Optional[GraphValidationResult] = None

class PrerequisiteCheckResponse(BaseModel):
    concept_id: str
    is_ready: bool
    missing_prerequisites: List[str] = Field(default_factory=list)
    remedial_question: Optional[str] = None
    next_recommended_concept: Optional[str] = None

class PrerequisiteCheckPayload(BaseModel):
    chapter_id: str
    target_concept_id: str
    mastered_concept_ids: List[str] = []
