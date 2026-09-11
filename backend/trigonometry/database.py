"""SQLAlchemy engine for the trigonometry subsystem only -- the rest of this
app uses raw psycopg (see core.py's db()/q()). Ported from edova-pilot-v4,
scoped to its own tables (concepts, student_states, interaction_logs,
telemetry_events) in the same Postgres database, via the psycopg3 dialect so
no second Postgres driver is needed alongside the app's existing psycopg."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core import DB_DSN
from trigonometry.models import Base

_SQLALCHEMY_DSN = DB_DSN.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(_SQLALCHEMY_DSN)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
