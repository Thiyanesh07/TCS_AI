"""
Regression Testing API endpoints for QualiTrust AI.
Supports regression suite management and cross-version execution comparisons.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import get_current_user, require_org_user
from app.models.user import User
from app.schemas.regression import (
    RegressionTestCreateRequest,
    RegressionTestResponseData,
    RegressionExecutionResponseData,
)
from app.services.regression_service import (
    list_regression_tests,
    create_regression_test,
    execute_regression_test_job,
)

router = APIRouter(tags=["Regression Testing"])


@router.get(
    "/applications/{application_id}/regression-tests",
    summary="List Regression Tests",
    description="Lists all regression test suites configured for an authorised application.",
)
def get_regression_tests(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    items = list_regression_tests(db, application_id, org_id)
    return {
        "data": [RegressionTestResponseData.model_validate(r) for r in items],
        "request_id": get_request_id(),
    }


@router.post(
    "/applications/{application_id}/regression-tests",
    status_code=status.HTTP_201_CREATED,
    summary="Create Regression Test Suite",
    description="Creates a regression test suite linking a baseline evaluation run to a target version.",
)
def post_regression_test(
    application_id: uuid.UUID,
    payload: RegressionTestCreateRequest,
    current_user: User = Depends(require_org_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    reg = create_regression_test(
        db=db,
        application_id=application_id,
        name=payload.name,
        baseline_run_id=payload.baseline_run_id,
        target_version_id=payload.target_version_id,
        organisation_id=org_id,
    )
    return {
        "data": RegressionTestResponseData.model_validate(reg),
        "request_id": get_request_id(),
    }


@router.post(
    "/regression-tests/{test_id}/execute",
    summary="Execute Regression Test",
    description="Executes comparative regression run and detects quality regressions against baseline.",
)
def execute_regression(
    test_id: uuid.UUID,
    current_user: User = Depends(require_org_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    result = execute_regression_test_job(db, test_id, org_id)
    return {
        "data": RegressionExecutionResponseData.model_validate(result),
        "request_id": get_request_id(),
    }

