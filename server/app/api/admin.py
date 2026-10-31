"""
Platform Administration API endpoints for QualiTrust AI.
Accessible strictly by PLATFORM_ADMIN users for tenant organisation management.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import require_platform_admin
from app.models.user import User
from app.schemas.admin import (
    OrganisationStatusUpdateRequest,
    PaginatedOrganisationsData,
    PaginationMetadata,
)
from app.services.admin_service import (
    list_organisations_admin,
    get_organisation_detail_admin,
    update_organisation_status_admin,
)

router = APIRouter(prefix="/admin", tags=["Platform Administration"])


@router.get(
    "/organisations",
    summary="List Tenant Organisations",
    description="Lists all organisations registered on the platform with operational metrics.",
)
def list_organisations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    admin_user: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    items, total = list_organisations_admin(
        db, page=page, page_size=page_size, status_filter=status_filter
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "data": PaginatedOrganisationsData(
            items=items,
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
    "/organisations/{organisation_id}",
    summary="Organisation Detail",
    description="Returns detailed organisation information for platform administrators.",
)
def get_organisation(
    organisation_id: uuid.UUID,
    admin_user: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    org = get_organisation_detail_admin(db, organisation_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found.",
        )
    return {
        "data": org,
        "request_id": get_request_id(),
    }


@router.patch(
    "/organisations/{organisation_id}/status",
    summary="Update Organisation Status",
    description="Updates the operational status of an organisation (e.g. active or suspended).",
)
def update_organisation_status(
    organisation_id: uuid.UUID,
    payload: OrganisationStatusUpdateRequest,
    admin_user: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    updated = update_organisation_status_admin(
        db, organisation_id, payload.status, admin_user
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found.",
        )
    return {
        "data": updated,
        "request_id": get_request_id(),
    }

