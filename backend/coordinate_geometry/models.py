"""Mirrors trigonometry/models.py's shape, own tables (coordgeo_*). Unlike trig,
there's no edova-reasoner support for Coordinate Geometry problem types yet, so
StudentState has no active_session_id -- there's no reasoner session to resume,
and CoordGeoQuestion carries its own hints/worked_solution instead of a
reasoner-shaped problem_spec (see routers/student.py for how "Next Problem"
degrades to a curated-content flow instead of an interactive derivation)."""
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Table, DateTime, JSON, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

prerequisites_association = Table(
    'coordgeo_prerequisites',
    Base.metadata,
    Column('concept_id', String, ForeignKey('coordgeo_concepts.id', ondelete="CASCADE"), primary_key=True),
    Column('prerequisite_id', String, ForeignKey('coordgeo_concepts.id', ondelete="CASCADE"), primary_key=True)
)

class Concept(Base):
    __tablename__ = 'coordgeo_concepts'

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    chapter = Column(String, default="Coordinate Geometry")
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
    __tablename__ = 'coordgeo_student_states'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, ForeignKey('coordgeo_concepts.id', ondelete="CASCADE"), nullable=False)
    active_step_index = Column(Integer, default=0)
    mastery_score = Column(Float, default=0.0)
    scaffold_assistance_level = Column(Float, default=1.0)
    consecutive_correct = Column(Integer, default=0)
    questions_solved = Column(Integer, default=0)
    active_session_id = Column(String(64), index=True, nullable=True)
    current_question_id = Column(Integer, ForeignKey('coordgeo_questions.id', ondelete="SET NULL"), nullable=True)
    cognitive_profile = Column(JSON, default=lambda: {
        "accuracy_rate": 0.0, "avg_response_latency_sec": 0.0, "total_attempts": 0,
    })
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept")
    current_question = relationship("CoordGeoQuestion")

class InteractionLog(Base):
    __tablename__ = 'coordgeo_interaction_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, ForeignKey('coordgeo_concepts.id', ondelete="CASCADE"), nullable=False)
    step_index = Column(Integer, nullable=False)
    raw_input = Column(String, nullable=True)
    step_score = Column(Float, nullable=False)
    response_time = Column(Float, default=0.0)
    sal_at_step = Column(Float, nullable=False)
    mastery_at_step = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    concept = relationship("Concept")

class TelemetryEvent(Base):
    __tablename__ = 'coordgeo_telemetry_events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, nullable=True, index=True)
    step_index = Column(Integer, default=0)
    event_type = Column(String, nullable=False, index=True)
    event_payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class CoordGeoQuestion(Base):
    __tablename__ = 'coordgeo_questions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    concept_id = Column(String, ForeignKey('coordgeo_concepts.id', ondelete="CASCADE"), nullable=False, index=True)
    chapter = Column(String, nullable=False, index=True)
    difficulty = Column(Float, default=1.0)
    title = Column(String, nullable=False)
    problem_text = Column(Text, nullable=False)
    hints = Column(JSON, default=dict)
    worked_solution = Column(JSON, default=list)
    expected_answer = Column(String, nullable=True)
    problem_spec = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept")
