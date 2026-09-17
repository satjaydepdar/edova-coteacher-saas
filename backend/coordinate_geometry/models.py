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
    mastery_score = Column(Float, default=0.0)
    questions_solved = Column(Integer, default=0)
    current_question_id = Column(Integer, ForeignKey('coordgeo_questions.id', ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept")
    current_question = relationship("CoordGeoQuestion")

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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept")
