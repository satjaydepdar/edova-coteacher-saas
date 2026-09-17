"""Mirrors trigonometry/schemas.py, trimmed to what coordinate_geometry actually uses
(no session/reasoner-shaped schemas -- see routers/student.py)."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ResetRequest(BaseModel):
    concept_id: str

class TelemetryEventCreate(BaseModel):
    concept_id: Optional[str] = Field(default="coordgeo-c1")
    step_index: int = Field(default=0)
    event_type: str
    event_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TelemetryEventResponse(BaseModel):
    status: str = "logged"
    event_id: int
    timestamp: str
