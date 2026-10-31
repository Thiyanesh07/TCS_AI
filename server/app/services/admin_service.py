"""
Platform administration service for QualiTrust AI.
Allows platform administrators to manage organisations and statuses.
"""

import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.organisation import Organisation
from app.models.user import User
from app.models.application import Application
from app.models.audit_event import AuditEvent
from app.schemas.admin import OrganisationResponseData


def list_organisations_admin(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
) -> Tuple[List[OrganisationResponseData], int]:
    """Lists all platform tenant organisations with metrics."""
    query = db.query(Organisation)
    if status_filter:
        query = query.filter(Organisation.status == status_filter.strip().lower())

    total = query.count()
    orgs = (
        query.order_by(Organisation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for org in orgs:
        user_count = db.query(User).filter(User.organisation_id == org.id).count()
        app_count = db.query(Application).filter(Application.organisation_id == org.id).count()
        items.append(
            OrganisationResponseData(
                id=org.id,
                name=org.name,
                slug=org.slug,
                status=org.status,
                user_count=user_count,
                application_count=app_count,
                created_at=org.created_at,
                updated_at=org.updated_at,
            )
        )
    return items, total


def get_organisation_detail_admin(
    db: Session,
    organisation_id: uuid.UUID,
) -> Optional[OrganisationResponseData]:
    """Retrieves detailed organisation record for platform administrators."""
    org = db.query(Organisation).filter(Organisation.id == organisation_id).first()
    if not org:
        return None

    user_count = db.query(User).filter(User.organisation_id == org.id).count()
    app_count = db.query(Application).filter(Application.organisation_id == org.id).count()

    return OrganisationResponseData(
        id=org.id,
        name=org.name,
        slug=org.slug,
        status=org.status,
        user_count=user_count,
        application_count=app_count,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


def update_organisation_status_admin(
    db: Session,
    organisation_id: uuid.UUID,
    new_status: str,
    admin_user: User,
) -> Optional[OrganisationResponseData]:
    """Updates organisation status (e.g., active or suspended) and creates an audit record."""
    valid_statuses = {"active", "suspended", "decommissioned"}
    clean_status = new_status.strip().lower()
    if clean_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{new_status}'. Allowed values are: {', '.join(sorted(valid_statuses))}.",
        )

    org = db.query(Organisation).filter(Organisation.id == organisation_id).first()
    if not org:
        return None

    old_status = org.status
    org.status = clean_status

    # Record audit event
    audit = AuditEvent(
        organisation_id=org.id,
        user_id=admin_user.id,
        action="ORGANISATION_STATUS_UPDATED",
        resource_type="organisation",
        resource_id=str(org.id),
        details={"old_status": old_status, "new_status": clean_status},
    )
    db.add(audit)
    db.commit()
    db.refresh(org)

    return get_organisation_detail_admin(db, org.id)

