"""Ported from edova-pilot-v4/backend/app/models.py, unchanged."""
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Table, DateTime, JSON, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

prerequisites_association = Table(
    'trig_prerequisites',
    Base.metadata,
    Column('concept_id', String, ForeignKey('trig_concepts.id', ondelete="CASCADE"), primary_key=True),
    Column('prerequisite_id', String, ForeignKey('trig_concepts.id', ondelete="CASCADE"), primary_key=True)
)

class Concept(Base):
    __tablename__ = 'trig_concepts'

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    chapter = Column(String, default="Trigonometry")
    difficulty = Column(Float, default=1.0)
    description = Column(Text, nullable=True)
    formula_reference = Column(String, nullable=True)
    problem_data = Column(JSON, default=dict)

    prerequisites = relationship(
        'Concept',
        secondary=prerequisites_association,
        primaryjoin=id == prerequisites_association.c.concept_id,
        secondaryjoin=id == prerequisites_association.c.prerequisite_id,
        backref='unlocked_by'
    )

class StudentState(Base):
    __tablename__ = 'trig_student_states'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, ForeignKey('trig_concepts.id', ondelete="CASCADE"), nullable=False)
    active_step_index = Column(Integer, default=0)
    mastery_score = Column(Float, default=0.0)
    scaffold_assistance_level = Column(Float, default=1.0)
    consecutive_correct = Column(Integer, default=0)
    cognitive_profile = Column(JSON, default=lambda: {
        "accuracy_rate": 0.0,
        "avg_response_latency_sec": 0.0,
        "total_attempts": 0,
        "strengths": [],
        "struggles": []
    })
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept")

class InteractionLog(Base):
    __tablename__ = 'trig_interaction_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, ForeignKey('trig_concepts.id', ondelete="CASCADE"), nullable=False)
    step_index = Column(Integer, nullable=False)
    raw_input = Column(String, nullable=True)
    step_score = Column(Float, nullable=False)
    response_time = Column(Float, default=0.0)
    sal_at_step = Column(Float, nullable=False)
    mastery_at_step = Column(Float, nullable=False)
    strategy_used = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    concept = relationship("Concept")

class TelemetryEvent(Base):
    __tablename__ = 'trig_telemetry_events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, nullable=True, index=True)
    step_index = Column(Integer, default=0)
    event_type = Column(String, nullable=False, index=True)
    event_payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
