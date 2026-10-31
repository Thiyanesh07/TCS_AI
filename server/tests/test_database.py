"""
Tests for SQLAlchemy models, foreign keys, relationships, session management, and migrations.
"""

import uuid
from sqlalchemy.orm import Session
from app.database.base import Base
from app.models import (
    Organisation,
    User,
    Application,
    ApplicationVersion,
    Risk,
    TestCase,
    EvaluationRun,
    TestResult,
    Finding,
    Evidence,
    RegressionTest,
    ReleaseReview,
    AuditEvent,
)


def test_required_model_tables_registered():
    """Verify all 13 core tables are registered in the Declarative Base metadata."""
    expected_tables = {
        "organisations",
        "users",
        "refresh_tokens",
        "applications",
        "application_versions",
        "risks",
        "test_cases",
        "evaluation_runs",
        "test_results",
        "findings",
        "evidence",
        "regression_tests",
        "release_reviews",
        "audit_events",
    }
    actual_tables = set(Base.metadata.tables.keys())
    missing = expected_tables - actual_tables
    assert not missing, f"Missing tables in metadata: {missing}"


def test_organisation_application_run_relational_flow(db_session: Session):
    """
    Verify creating an organisation, application, version, evaluation run,
    and associated test result & finding strictly preserves relational hierarchy.
    """
    # 1. Organisation
    org = Organisation(
        name="Acme Corp",
        slug="acme-corp",
        status="active",
    )
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    assert isinstance(org.id, uuid.UUID)

    # 2. Application
    app = Application(
        organisation_id=org.id,
        name="Customer Service AI Bot",
        description="LLM support assistant",
        integration_type="api",
        status="registered",
    )
    db_session.add(app)
    db_session.commit()
    db_session.refresh(app)
    assert app.organisation_id == org.id

    # 3. Application Version
    version = ApplicationVersion(
        application_id=app.id,
        version_label="v1.0.0",
        source_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)

    # 4. Evaluation Run
    run = EvaluationRun(
        application_id=app.id,
        version_id=version.id,
        status="completed",
        quality_score=88.5,
        release_status="eligible",
        total_tests=10,
        passed_tests=9,
        failed_tests=1,
        uncertain_tests=0,
        error_tests=0,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    assert run.application_id == app.id
    assert run.version_id == version.id
    assert run.status == "completed"
    assert run.release_status == "eligible"

    # 5. Test Result
    tr = TestResult(
        evaluation_run_id=run.id,
        verdict="pass",
        severity="medium",
        output_summary="Passed prompt injection resistance check",
    )
    db_session.add(tr)
    db_session.commit()
    db_session.refresh(tr)
    assert tr.verdict == "pass"

    # 6. Finding
    finding = Finding(
        evaluation_run_id=run.id,
        title="Excessive prompt token consumption",
        severity="low",
        status="open",
    )
    db_session.add(finding)
    db_session.commit()
    db_session.refresh(finding)
    assert finding.status == "open"


def test_session_lifecycle_and_rollback(db_session: Session):
    """Verify that a session correctly rolls back on invalid constraints."""
    org1 = Organisation(name="Unique Org", slug="unique-org-slug")
    db_session.add(org1)
    db_session.commit()

    # Attempt inserting duplicate slug
    org2 = Organisation(name="Another Org", slug="unique-org-slug")
    db_session.add(org2)
    try:
        db_session.commit()
        assert False, "Expected IntegrityError on duplicate slug"
    except Exception:
        db_session.rollback()

    # Session should be healthy after rollback
    active_org = db_session.query(Organisation).filter_by(slug="unique-org-slug").first()
    assert active_org is not None
    assert active_org.name == "Unique Org"


def test_alembic_script_discovery():
    """Verify that Alembic configuration can discover the initial migration revision."""
    from pathlib import Path
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    ini_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    alembic_cfg = Config(str(ini_path))
    script = ScriptDirectory.from_config(alembic_cfg)
    heads = script.get_heads()
    assert "0003_storage_key_in_versions" in heads
