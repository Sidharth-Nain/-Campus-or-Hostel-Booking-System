"""SQLAlchemy setup shared by database models and API routes."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


settings = get_settings()

database_url = make_url(settings.database_url)
if database_url.drivername in {"postgres", "postgresql"}:
    database_url = database_url.set(drivername="postgresql+psycopg")
connect_args = {"check_same_thread": False} if database_url.get_backend_name() == "sqlite" else {}
engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)
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
