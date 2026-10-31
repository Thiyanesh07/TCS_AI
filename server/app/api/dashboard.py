"""
Dashboard API endpoints for QualiTrust AI.
Provides summary metrics and recent activity feeds.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.dashboard_service import get_dashboard_summary, get_dashboard_activity

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    summary="Dashboard Summary",
    description="Returns aggregate quality metrics, application counts, and release readiness states.",
)
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Tenant-scoped for ORG_USER, platform-wide for PLATFORM_ADMIN
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    summary = get_dashboard_summary(db, org_id)
    return {
        "data": summary,
        "request_id": get_request_id(),
    }


@router.get(
    "/activity",
    summary="Dashboard Activity Feed",
    description="Returns recent activity events for the tenant or platform.",
)
def dashboard_activity(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    activity = get_dashboard_activity(db, org_id, limit=limit)
    return {
        "data": activity,
        "request_id": get_request_id(),
    }

