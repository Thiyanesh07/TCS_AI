"""
Evaluation Run and Release Review API endpoints for QualiTrust AI.
Manages evaluation triggering, status tracking, test results, findings, and release decisions.
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import get_current_user, require_org_user, enforce_organisation_access
from app.models.user import User
from app.schemas.evaluation import (
    EvaluationTriggerRequest,
    EvaluationRunResponseData,
    TestResultResponseData,
    FindingResponseData,
    PaginatedEvaluationsData,
)
from app.schemas.release_review import (
    ReleaseReviewSubmitRequest,
    ReleaseReviewResponseData,
    ReleaseReviewInfoData,
)
from app.schemas.application import PaginationMetadata
from app.services.application_service import get_application_by_id
from app.services.evaluation_service import (
    trigger_evaluation_run,
    execute_evaluation_job,
    list_evaluations,
    get_evaluation_run,
    get_evaluation_results,
    get_evaluation_findings,
)
from app.services.release_review_service import get_release_review_info, submit_release_review

router = APIRouter(tags=["Evaluations"])


@router.post(
    "/applications/{application_id}/evaluations",
    status_code=status.HTTP_201_CREATED,
    summary="Trigger Evaluation Run",
    description="Enqueues and starts an automated quality and security evaluation run on an application version.",
)
def create_evaluation(
    application_id: uuid.UUID,
    payload: EvaluationTriggerRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_org_user),
    db: Session = Depends(get_db),
):
    app = get_application_by_id(db, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    enforce_organisation_access(current_user, app.organisation_id)

    run = trigger_evaluation_run(db, app, payload.version_id)

    # Queue evaluation engine execution as background job
    background_tasks.add_task(execute_evaluation_job, run.id)

    return {
        "data": EvaluationRunResponseData.model_validate(run),
        "request_id": get_request_id(),
    }


@router.get(
    "/evaluations",
    summary="List Evaluation Runs",
    description="Lists evaluation runs filtered by tenant organisation and optional application ID.",
)
def get_evaluations(
    application_id: Optional[uuid.UUID] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    items, total = list_evaluations(
        db, organisation_id=org_id, application_id=application_id, page=page, page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "data": PaginatedEvaluationsData(
            items=[EvaluationRunResponseData.model_validate(r) for r in items],
            pagination=PaginationMetadata(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
        "request_id": get_request_id(),
    }


@router.get(
    "/evaluations/{run_id}",
    summary="Get Evaluation Run Details",
    description="Retrieves status, quality score, test counts, and release status of an evaluation run.",
)
def get_evaluation(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    run = get_evaluation_run(db, run_id, org_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation run not found.",
        )

    return {
        "data": EvaluationRunResponseData.model_validate(run),
        "request_id": get_request_id(),
    }


@router.get(
    "/evaluations/{run_id}/results",
    summary="Get Evaluation Test Results",
    description="Lists all test case execution verdicts, durations, and output summaries.",
)
def get_results(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    results = get_evaluation_results(db, run_id, org_id)
    return {
        "data": [TestResultResponseData.model_validate(r) for r in results],
        "request_id": get_request_id(),
    }


@router.get(
    "/evaluations/{run_id}/findings",
    summary="Get Evaluation Findings",
    description="Lists all security, safety, and reliability findings identified during evaluation.",
)
def get_findings(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    findings = get_evaluation_findings(db, run_id, org_id)
    return {
        "data": [FindingResponseData.model_validate(f) for f in findings],
        "request_id": get_request_id(),
    }


@router.get(
    "/evaluations/{run_id}/release-review",
    summary="Get Release Review Information",
    description="Retrieves release readiness metrics and existing review decision.",
)
def get_release_review(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    info = get_release_review_info(db, run_id, org_id)
    return {
        "data": ReleaseReviewInfoData.model_validate(info),
        "request_id": get_request_id(),
    }


@router.post(
    "/evaluations/{run_id}/release-review",
    summary="Submit Release Review Decision",
    description="Submits a sign-off decision (approved, rejected, or conditionally_approved) for a completed run.",
)
def post_release_review(
    run_id: uuid.UUID,
    payload: ReleaseReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = submit_release_review(
        db=db,
        run_id=run_id,
        decision=payload.decision,
        notes=payload.notes,
        reviewer=current_user,
    )
    return {
        "data": ReleaseReviewResponseData.model_validate(review),
        "request_id": get_request_id(),
    }

