"""
Application registration and lifecycle management API endpoints for QualiTrust AI.
Supports ZIP archive uploads, external API targets, versioning, and discovery.
"""

import uuid
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.core.request_context import get_request_id
from app.core.dependencies import (
    get_current_user,
    require_org_user,
    enforce_organisation_access,
)
from app.models.user import User
from app.schemas.application import (
    ApplicationApiCreateRequest,
    ApplicationResponseData,
    ApplicationVersionResponseData,
    ApplicationDiscoveryResponseData,
    PaginatedApplicationsData,
    PaginatedVersionsData,
    PaginationMetadata,
)
from app.services.application_service import (
    register_zip_application,
    register_api_application,
    list_applications,
    get_application_by_id,
    list_application_versions,
    get_application_discovery,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "/zip",
    status_code=status.HTTP_201_CREATED,
    summary="Register Application via ZIP Upload",
    description="Uploads and inspects an application ZIP bundle, registering the application and initial version.",
)
@router.post(
    "/upload-zip",
    status_code=status.HTTP_201_CREATED,
    summary="Register Application via ZIP Upload (Alias)",
    description="Uploads and inspects an application ZIP bundle, registering the application and initial version.",
)
async def register_application_zip(
    name: str = Form(..., min_length=1, max_length=255),
    description: Optional[str] = Form(None),
    version_label: Optional[str] = Form(None),
    version: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    package: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_org_user),
    db: Session = Depends(get_db),
):
    if not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organisation association is required to register applications.",
        )

    upload_file = file or package
    if not upload_file:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid .zip file must be uploaded under the 'file' or 'package' parameter.",
        )

    active_version_label = version_label or version or "v1.0.0"

    # Read uploaded bytes with size enforcement
    content = await upload_file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    app, app_ver = register_zip_application(
        db=db,
        organisation_id=current_user.organisation_id,
        name=name,
        description=description,
        version_label=active_version_label,
        zip_bytes=content,
        filename=upload_file.filename,
    )

    return {
        "data": ApplicationResponseData(
            id=app.id,
            organisation_id=app.organisation_id,
            name=app.name,
            description=app.description,
            integration_type=app.integration_type,
            status=app.status,
            created_at=app.created_at,
            updated_at=app.updated_at,
        ),
        "request_id": get_request_id(),
    }


@router.post(
    "/api",
    status_code=status.HTTP_201_CREATED,
    summary="Register Application via API Target",
    description="Registers an AI application targeting an external HTTPS API endpoint.",
)
@router.post(
    "/connect-api",
    status_code=status.HTTP_201_CREATED,
    summary="Register Application via API Target (Alias)",
    description="Registers an AI application targeting an external HTTPS API endpoint.",
)
def register_application_api(
    payload: ApplicationApiCreateRequest,
    current_user: User = Depends(require_org_user),
    db: Session = Depends(get_db),
):
    if not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organisation association is required to register applications.",
        )

    target_url = payload.get_target_url()
    version_label = payload.get_version_label()

    app, version = register_api_application(
        db=db,
        organisation_id=current_user.organisation_id,
        name=payload.name,
        description=payload.description,
        target_url=target_url,
        version_label=version_label,
    )

    return {
        "data": ApplicationResponseData(
            id=app.id,
            organisation_id=app.organisation_id,
            name=app.name,
            description=app.description,
            integration_type=app.integration_type,
            status=app.status,
            created_at=app.created_at,
            updated_at=app.updated_at,
        ),
        "request_id": get_request_id(),
    }


@router.get(
    "",
    summary="List Applications",
    description="Lists applications owned by the user's organisation with pagination.",
)
def get_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    items, total = list_applications(db, organisation_id=org_id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "data": PaginatedApplicationsData(
            items=[
                ApplicationResponseData(
                    id=app.id,
                    organisation_id=app.organisation_id,
                    name=app.name,
                    description=app.description,
                    integration_type=app.integration_type,
                    status=app.status,
                    created_at=app.created_at,
                    updated_at=app.updated_at,
                )
                for app in items
            ],
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
    "/{application_id}",
    summary="Get Application Details",
    description="Retrieves application details by ID, enforcing multi-tenant isolation.",
)
def get_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = get_application_by_id(db, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    enforce_organisation_access(current_user, app.organisation_id)

    return {
        "data": ApplicationResponseData(
            id=app.id,
            organisation_id=app.organisation_id,
            name=app.name,
            description=app.description,
            integration_type=app.integration_type,
            status=app.status,
            created_at=app.created_at,
            updated_at=app.updated_at,
        ),
        "request_id": get_request_id(),
    }


@router.get(
    "/{application_id}/discovery",
    summary="Get Application Discovery Information",
    description="Retrieves discovered components, endpoints, and capabilities for an application.",
)
def get_discovery(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = get_application_by_id(db, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    enforce_organisation_access(current_user, app.organisation_id)

    discovery = get_application_discovery(db, app)
    return {
        "data": discovery,
        "request_id": get_request_id(),
    }


@router.get(
    "/{application_id}/versions",
    summary="List Application Versions",
    description="Lists version history and source hashes for the specified application.",
)
def get_versions(
    application_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = get_application_by_id(db, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    enforce_organisation_access(current_user, app.organisation_id)

    items, total = list_application_versions(db, application_id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "data": PaginatedVersionsData(
            items=[
                ApplicationVersionResponseData(
                    id=v.id,
                    application_id=v.application_id,
                    version_label=v.version_label,
                    source_hash=v.source_hash,
                    created_at=v.created_at,
                )
                for v in items
            ],
            pagination=PaginationMetadata(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
        "request_id": get_request_id(),
    }
