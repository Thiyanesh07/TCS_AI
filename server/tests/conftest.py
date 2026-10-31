"""
Pytest configuration and fixtures for QualiTrust AI backend tests.
Uses SQLite in-memory with StaticPool to ensure a single shared in-memory database
across all test connections and FastAPI dependency overrides.
"""

import os
import shutil
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import create_app
from app.database.base import Base
from app.database.session import get_db, set_session_factory

# Isolated in-memory SQLite database for test execution with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all model tables in SQLite memory for testing, tear down after session."""
    set_session_factory(TestingSessionLocal)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    # Clean up test storage directory if created
    if os.path.exists("storage_data"):
        shutil.rmtree("storage_data", ignore_errors=True)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provide an isolated database session for each test, cleaning up data afterwards."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up records across all tables after each test
        with test_engine.connect() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                conn.execute(table.delete())
            conn.commit()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Test client with database session dependency overridden for test isolation."""
    app = create_app()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
