"""
SQLAlchemy Session and Engine Management for QualiTrust AI.
Handles connection pooling, session lifecycle, and dependency injection for FastAPI.
"""

from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

_engine = None
_session_factory = None


def get_engine():
    """Lazily initializes and returns the SQLAlchemy engine."""
    global _engine
    if _engine is not None:
        return _engine

    if not settings.DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured. Please configure it in your .env file."
        )

    url = settings.DATABASE_URL
    is_sqlite = url.startswith("sqlite")

    engine_kwargs = {
        "pool_pre_ping": True,
    }

    if not is_sqlite:
        engine_kwargs.update({
            "pool_size": settings.DATABASE_POOL_SIZE,
            "max_overflow": settings.DATABASE_MAX_OVERFLOW,
            "connect_args": {"connect_timeout": settings.DATABASE_CONNECT_TIMEOUT},
        })

    _engine = create_engine(url, **engine_kwargs)
    return _engine


def set_session_factory(factory):
    """Sets or overrides the session factory (e.g., for test environments)."""
    global _session_factory
    _session_factory = factory


def get_session_factory():
    """Returns the session factory bound to the active engine."""
    global _session_factory
    if _session_factory is not None:
        return _session_factory

    engine = get_engine()
    _session_factory = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False,
    )
    return _session_factory


def SessionLocal() -> Session:
    """Helper to instantiate a new database session."""
    factory = get_session_factory()
    return factory()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    Rolls back automatically on unhandled exception and closes cleanly in finally.
    """
    db: Optional[Session] = None
    try:
        db = SessionLocal()
        yield db
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        if db is not None:
            db.close()

