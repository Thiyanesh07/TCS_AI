"""
Release review service for QualiTrust AI.
Enforces deterministic release sign-off rules and audit trails.
"""

import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.evaluation_run import EvaluationRun
from app.models.release_review import ReleaseReview
from app.models.audit_event import AuditEvent
from app.models.user import User
from app.services.evaluation_service import get_evaluation_run


def get_release_review_info(
    db: Session,
    run_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """Retrieves release readiness status and existing review sign-off."""
    run = get_evaluation_run(db, run_id, organisation_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation run not found.",
        )

    review_data = None
    if run.release_review:
        review_data = {
            "id": run.release_review.id,
            "decision": run.release_review.decision,
            "notes": run.release_review.notes,
            "reviewer_user_id": run.release_review.reviewer_user_id,
            "created_at": run.release_review.created_at,
            "updated_at": run.release_review.updated_at,
        }

    return {
        "evaluation_run_id": run.id,
        "application_id": run.application_id,
        "status": run.status,
        "quality_score": run.quality_score,
        "release_status": run.release_status,
        "review": review_data,
    }


def submit_release_review(
    db: Session,
    run_id: uuid.UUID,
    decision: str,
    notes: Optional[str],
    reviewer: User,
) -> ReleaseReview:
    """
    Submits a release review sign-off decision.
    Applies deterministic rules: blocked evaluations cannot be marked 'approved'.
    """
    valid_decisions = {"approved", "rejected", "conditionally_approved"}
    clean_decision = decision.strip().lower()
    if clean_decision not in valid_decisions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid decision '{decision}'. Allowed values: {', '.join(sorted(valid_decisions))}.",
        )

    run = get_evaluation_run(db, run_id, reviewer.organisation_id if reviewer.role == "ORG_USER" else None)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation run not found.",
        )

    if run.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit release review for an incomplete evaluation run.",
        )

    # Deterministic release policy guard
    if run.release_status == "blocked" and clean_decision == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve release: Evaluation is marked 'blocked' due to critical security or quality issues.",
        )

    review = run.release_review
    if review:
        review.decision = clean_decision
        review.notes = notes.strip() if notes else None
        review.reviewer_user_id = reviewer.id
    else:
        review = ReleaseReview(
            evaluation_run_id=run.id,
            reviewer_user_id=reviewer.id,
            decision=clean_decision,
            notes=notes.strip() if notes else None,
        )
        db.add(review)

    # Audit event
    audit = AuditEvent(
        organisation_id=run.application.organisation_id,
        user_id=reviewer.id,
        action="RELEASE_REVIEW_SUBMITTED",
        resource_type="release_review",
        resource_id=str(run.id),
        details={"decision": clean_decision, "release_status": run.release_status},
    )
    db.add(audit)
    db.commit()
    db.refresh(review)
    return review

