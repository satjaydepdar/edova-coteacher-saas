"""Ported from edova-pilot-v4/backend/app/schemas.py, unchanged."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class StepHistoryItem(BaseModel):
    step_index: int
    instruction: str
    result: str
    completed: bool

class CognitiveMetrics(BaseModel):
    assistance_sal: float
    concept_mastery: float
    active_attempts: int
    accuracy_rate: float

class ResetRequest(BaseModel):
    concept_id: str

class TelemetryEventCreate(BaseModel):
    concept_id: Optional[str] = Field(default="trig-101")
    step_index: int = Field(default=0)
    event_type: str
    event_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TelemetryEventResponse(BaseModel):
    status: str = "logged"
    event_id: int
    timestamp: str
