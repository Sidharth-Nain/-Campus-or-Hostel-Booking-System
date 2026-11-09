"""SQLAlchemy setup shared by database models and API routes."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class for every database table model."""


def get_db() -> Generator[Session, None, None]:
    """Yield one database session for a request and close it afterwards."""

    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()
