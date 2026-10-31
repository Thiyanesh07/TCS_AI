"""
Regression test service for QualiTrust AI.
Manages regression test suites and executes comparative evaluations across versions.
"""

import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.evaluation_run import EvaluationRun
from app.models.regression_test import RegressionTest
from app.models.audit_event import AuditEvent
from app.services.application_service import get_application_by_id
from app.services.evaluation_service import trigger_evaluation_run, execute_evaluation_job


def list_regression_tests(
    db: Session,
    application_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> List[RegressionTest]:
    """Lists regression test suites configured for an authorised application."""
    app = get_application_by_id(db, application_id, organisation_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return db.query(RegressionTest).filter(RegressionTest.application_id == application_id).all()


def create_regression_test(
    db: Session,
    application_id: uuid.UUID,
    name: str,
    baseline_run_id: Optional[uuid.UUID],
    target_version_id: Optional[uuid.UUID],
    organisation_id: Optional[uuid.UUID] = None,
) -> RegressionTest:
    """Creates a new regression test suite associated with an application and baseline run."""
    app = get_application_by_id(db, application_id, organisation_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    if baseline_run_id:
        baseline = (
            db.query(EvaluationRun)
            .filter(
                EvaluationRun.id == baseline_run_id,
                EvaluationRun.application_id == app.id,
            )
            .first()
        )
        if not baseline:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Baseline evaluation run not found for this application.",
            )

    if target_version_id:
        version = (
            db.query(ApplicationVersion)
            .filter(
                ApplicationVersion.id == target_version_id,
                ApplicationVersion.application_id == app.id,
            )
            .first()
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target application version not found for this application.",
            )

    reg = RegressionTest(
        application_id=app.id,
        name=name.strip(),
        baseline_run_id=baseline_run_id,
        target_version_id=target_version_id,
        status="active",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    audit = AuditEvent(
        organisation_id=app.organisation_id,
        action="REGRESSION_TEST_CREATED",
        resource_type="regression_test",
        resource_id=str(reg.id),
        details={"name": reg.name, "baseline_run_id": str(baseline_run_id) if baseline_run_id else None},
    )
    db.add(audit)
    db.commit()
    return reg


def execute_regression_test_job(
    db: Session,
    test_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Executes a regression test: triggers an evaluation run on the target version,
    runs the inspection, and compares scores against the baseline run.
    """
    reg = db.query(RegressionTest).join(Application).filter(RegressionTest.id == test_id).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regression test not found.",
        )

    app = reg.application
    if organisation_id is not None and app.organisation_id != organisation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regression test not found.",
        )

    # Trigger evaluation run on target version
    new_run = trigger_evaluation_run(db, app, reg.target_version_id)
    execute_evaluation_job(new_run.id)
    db.refresh(new_run)

    # Compare against baseline
    baseline_score = None
    regression_detected = False
    if reg.baseline_run_id:
        baseline = db.query(EvaluationRun).filter(EvaluationRun.id == reg.baseline_run_id).first()
        if baseline and baseline.quality_score is not None:
            baseline_score = baseline.quality_score
            if new_run.quality_score is not None and new_run.quality_score < baseline_score:
                regression_detected = True

    return {
        "regression_test_id": reg.id,
        "name": reg.name,
        "evaluation_run_id": new_run.id,
        "status": new_run.status,
        "current_quality_score": new_run.quality_score,
        "baseline_quality_score": baseline_score,
        "regression_detected": regression_detected,
        "release_status": new_run.release_status,
    }

