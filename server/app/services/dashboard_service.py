"""
Dashboard service for QualiTrust AI.
Aggregates quality statistics, risk counts, and activity feeds from real database records.
"""

import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.application import Application
from app.models.evaluation_run import EvaluationRun
from app.models.risk import Risk
from app.models.audit_event import AuditEvent
from app.schemas.dashboard import DashboardSummaryData, DashboardActivityItem, DashboardActivityData


def get_dashboard_summary(
    db: Session,
    organisation_id: Optional[uuid.UUID] = None,
) -> DashboardSummaryData:
    """Computes aggregate quality metrics scoped to the user's organisation or platform-wide."""
    # Applications
    app_query = db.query(Application)
    if organisation_id is not None:
        app_query = app_query.filter(Application.organisation_id == organisation_id)
    total_applications = app_query.count()

    # Evaluation Runs
    run_query = db.query(EvaluationRun).join(Application)
    if organisation_id is not None:
        run_query = run_query.filter(Application.organisation_id == organisation_id)

    total_evaluations = run_query.count()
    eligible_releases = run_query.filter(EvaluationRun.release_status == "eligible").count()
    blocked_releases = run_query.filter(EvaluationRun.release_status == "blocked").count()

    avg_score = run_query.with_entities(func.avg(EvaluationRun.quality_score)).scalar()
    avg_quality = round(float(avg_score), 1) if avg_score is not None else None

    # Risks
    risk_query = db.query(Risk).join(Application)
    if organisation_id is not None:
        risk_query = risk_query.filter(Application.organisation_id == organisation_id)
    total_risks = risk_query.count()

    return DashboardSummaryData(
        total_applications=total_applications,
        total_evaluations=total_evaluations,
        total_risks=total_risks,
        eligible_releases=eligible_releases,
        blocked_releases=blocked_releases,
        average_quality_score=avg_quality,
    )


def get_dashboard_activity(
    db: Session,
    organisation_id: Optional[uuid.UUID] = None,
    limit: int = 20,
) -> DashboardActivityData:
    """Retrieves recent activity timeline from audit events."""
    query = db.query(AuditEvent)
    if organisation_id is not None:
        query = query.filter(AuditEvent.organisation_id == organisation_id)

    total = query.count()
    events = query.order_by(AuditEvent.created_at.desc()).limit(limit).all()

    items = [
        DashboardActivityItem(
            id=event.id,
            action=event.action,
            resource_type=event.resource_type,
            resource_id=event.resource_id,
            description=f"{event.action.replace('_', ' ').title()} on {event.resource_type}",
            timestamp=event.created_at,
        )
        for event in events
    ]

    return DashboardActivityData(
        items=items,
        total=total,
    )

