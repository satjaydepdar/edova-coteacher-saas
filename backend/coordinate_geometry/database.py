"""SQLAlchemy engine for the coordinate_geometry subsystem only, mirroring
trigonometry/database.py -- own tables in the same Postgres database."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core import DB_DSN
from coordinate_geometry.models import Base

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
