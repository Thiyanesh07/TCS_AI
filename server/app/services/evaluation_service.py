"""
Evaluation service for QualiTrust AI.
Manages evaluation run lifecycles, background execution, test results, findings, and evidence.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.database.session import SessionLocal
from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.evaluation_run import EvaluationRun
from app.models.test_case import TestCase
from app.models.test_result import TestResult
from app.models.finding import Finding
from app.models.evidence import Evidence
from app.models.regression_test import RegressionTest
from app.models.audit_event import AuditEvent
from app.services.storage_service import get_storage_service
from app.services.evaluation_engine import evaluate_zip_application, evaluate_api_application


def trigger_evaluation_run(
    db: Session,
    application: Application,
    version_id: Optional[uuid.UUID] = None,
) -> EvaluationRun:
    """
    Creates and enqueues a new evaluation run for an application version.
    Prevents duplicate active executions on the exact same version.
    """
    # 1. Resolve version
    if version_id:
        version = (
            db.query(ApplicationVersion)
            .filter(
                ApplicationVersion.id == version_id,
                ApplicationVersion.application_id == application.id,
            )
            .first()
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified application version not found.",
            )
    else:
        version = (
            db.query(ApplicationVersion)
            .filter(ApplicationVersion.application_id == application.id)
            .order_by(ApplicationVersion.created_at.desc())
            .first()
        )
        if not version:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application does not have any registered versions.",
            )

    # 2. Check for duplicate pending / running execution
    active_run = (
        db.query(EvaluationRun)
        .filter(
            EvaluationRun.application_id == application.id,
            EvaluationRun.version_id == version.id,
            EvaluationRun.status.in_(["queued", "running"]),
        )
        .first()
    )
    if active_run:
        # Return existing active run to avoid duplicate submissions
        return active_run

    # 3. Create run in QUEUED status
    run = EvaluationRun(
        application_id=application.id,
        version_id=version.id,
        status="queued",
        release_status="pending",
    )
    db.add(run)
    db.flush()

    audit = AuditEvent(
        organisation_id=application.organisation_id,
        action="EVALUATION_RUN_QUEUED",
        resource_type="evaluation_run",
        resource_id=str(run.id),
        details={"version_label": version.version_label},
    )
    db.add(audit)
    db.commit()
    db.refresh(run)
    return run


def execute_evaluation_job(run_id: uuid.UUID) -> None:
    """
    Background worker task executing the evaluation run.
    Performs safety inspections, persists test results and findings in a single transaction.
    """
    db = SessionLocal()
    try:
        run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
        if not run or run.status in ["completed", "failed", "cancelled"]:
            return

        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        db.commit()

        app = db.query(Application).filter(Application.id == run.application_id).first()
        version = db.query(ApplicationVersion).filter(ApplicationVersion.id == run.version_id).first()

        if not app or not version:
            run.status = "failed"
            run.release_status = "inconclusive"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        # Execute Engine according to integration type
        if app.integration_type == "zip":
            if not version.storage_key:
                run.status = "failed"
                run.release_status = "inconclusive"
                run.completed_at = datetime.now(timezone.utc)
                db.commit()
                return

            storage = get_storage_service()
            zip_bytes = storage.download_file(version.storage_key)
            result_data = evaluate_zip_application(zip_bytes, run_id=run.id, application_id=app.id, version_id=version.id)

        elif app.integration_type == "api":
            # Retrieve target URL from audit events
            latest_audit = (
                db.query(AuditEvent)
                .filter(
                    AuditEvent.resource_id == str(app.id),
                    AuditEvent.action == "APPLICATION_REGISTERED_API",
                )
                .first()
            )
            target_url = latest_audit.details.get("target_url") if latest_audit and latest_audit.details else None
            if not target_url:
                run.status = "failed"
                run.release_status = "inconclusive"
                run.completed_at = datetime.now(timezone.utc)
                db.commit()
                return

            result_data = evaluate_api_application(target_url, run_id=run.id, application_id=app.id, version_id=version.id)
        else:
            run.status = "failed"
            run.release_status = "inconclusive"
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        # Persist test cases and test results
        test_case_map = {}
        for tc_dict in result_data.test_cases:
            tc = (
                db.query(TestCase)
                .filter(
                    TestCase.application_id == app.id,
                    TestCase.name == tc_dict["name"],
                )
                .first()
            )
            if not tc:
                tc = TestCase(
                    application_id=app.id,
                    name=tc_dict["name"],
                    category=tc_dict["category"],
                    is_automated=tc_dict["is_automated"],
                )
                db.add(tc)
                db.flush()
            test_case_map[tc_dict["name"]] = tc

        for tr_dict in result_data.test_results:
            tc = test_case_map.get(tr_dict["name"])
            tr = TestResult(
                evaluation_run_id=run.id,
                test_case_id=tc.id if tc else None,
                verdict=tr_dict["verdict"],
                severity=tr_dict["severity"],
                execution_duration_ms=tr_dict["execution_duration_ms"],
                output_summary=tr_dict["output_summary"],
            )
            db.add(tr)

        # Persist findings and evidence
        for f_dict in result_data.findings:
            finding = Finding(
                evaluation_run_id=run.id,
                title=f_dict["title"],
                description=f_dict["description"],
                severity=f_dict["severity"],
                status="open",
            )
            db.add(finding)
            db.flush()

            if "evidence" in f_dict and f_dict["evidence"]:
                ev_data = f_dict["evidence"]
                evidence = Evidence(
                    finding_id=finding.id,
                    evidence_type=ev_data.get("type", "log"),
                    file_path=ev_data.get("file_path"),
                    payload=ev_data.get("payload"),
                )
                db.add(evidence)

        # Persist regression recommendations
        if hasattr(result_data, 'regression_tests'):
            for reg_dict in result_data.regression_tests:
                reg_name = reg_dict['name']
                existing_reg = (
                    db.query(RegressionTest)
                    .filter(
                        RegressionTest.application_id == app.id,
                        RegressionTest.name == reg_name,
                    )
                    .first()
                )
                if not existing_reg:
                    reg = RegressionTest(
                        application_id=app.id,
                        name=reg_name,
                        baseline_run_id=run.id,
                        target_version_id=version.id,
                        status=reg_dict.get('status', 'active'),
                    )
                    db.add(reg)

        # Update run completion state
        run.quality_score = result_data.quality_score
        run.release_status = result_data.release_status
        run.total_tests = result_data.total_tests
        run.passed_tests = result_data.passed_tests
        run.failed_tests = result_data.failed_tests
        run.uncertain_tests = result_data.uncertain_tests
        run.error_tests = result_data.error_tests
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)

        audit = AuditEvent(
            organisation_id=app.organisation_id,
            action="EVALUATION_RUN_COMPLETED",
            resource_type="evaluation_run",
            resource_id=str(run.id),
            details={
                "quality_score": run.quality_score,
                "release_status": run.release_status,
                "total_tests": run.total_tests,
            },
        )
        db.add(audit)
        db.commit()

    except Exception:
        db.rollback()
        try:
            failed_run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
            if failed_run:
                failed_run.status = "failed"
                failed_run.release_status = "inconclusive"
                failed_run.completed_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def list_evaluations(
    db: Session,
    organisation_id: Optional[uuid.UUID] = None,
    application_id: Optional[uuid.UUID] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[EvaluationRun], int]:
    """Lists evaluations with tenant isolation, optional application filtering, and pagination."""
    query = db.query(EvaluationRun).join(Application)
    if organisation_id is not None:
        query = query.filter(Application.organisation_id == organisation_id)
    if application_id is not None:
        query = query.filter(EvaluationRun.application_id == application_id)

    total = query.count()
    items = (
        query.order_by(EvaluationRun.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_evaluation_run(
    db: Session,
    run_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> Optional[EvaluationRun]:
    """Retrieves an evaluation run with tenant scoping."""
    query = db.query(EvaluationRun).join(Application).filter(EvaluationRun.id == run_id)
    if organisation_id is not None:
        query = query.filter(Application.organisation_id == organisation_id)
    return query.first()


def get_evaluation_results(
    db: Session,
    run_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> List[TestResult]:
    """Retrieves test results for a tenant-authorised evaluation run."""
    run = get_evaluation_run(db, run_id, organisation_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation run not found.",
        )
    return db.query(TestResult).filter(TestResult.evaluation_run_id == run.id).all()


def get_evaluation_findings(
    db: Session,
    run_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> List[Finding]:
    """Retrieves findings for a tenant-authorised evaluation run."""
    run = get_evaluation_run(db, run_id, organisation_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation run not found.",
        )
    return db.query(Finding).filter(Finding.evaluation_run_id == run.id).all()


def get_finding_by_id(
    db: Session,
    finding_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> Optional[Finding]:
    """Retrieves finding by ID, enforcing multi-tenant isolation."""
    query = (
        db.query(Finding)
        .join(EvaluationRun)
        .join(Application)
        .filter(Finding.id == finding_id)
    )
    if organisation_id is not None:
        query = query.filter(Application.organisation_id == organisation_id)
    return query.first()


def get_finding_evidence(
    db: Session,
    finding_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> List[Evidence]:
    """Retrieves evidence for a verified tenant-owned finding."""
    finding = get_finding_by_id(db, finding_id, organisation_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found.",
        )
    return db.query(Evidence).filter(Evidence.finding_id == finding.id).all()

