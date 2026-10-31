"""
Application service for QualiTrust AI.
Handles application registration (ZIP & API), multi-tenant listing, details,
version tracking, and component discovery.
"""

import uuid
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.core.archive_validator import validate_zip_archive
from app.core.api_target_validator import validate_api_target_url
from app.services.storage_service import get_storage_service, generate_application_storage_key
from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.audit_event import AuditEvent


def register_zip_application(
    db: Session,
    organisation_id: uuid.UUID,
    name: str,
    description: Optional[str],
    version_label: str,
    zip_bytes: bytes,
    filename: Optional[str] = None,
) -> Tuple[Application, ApplicationVersion]:
    """
    Registers an AI application from an uploaded ZIP archive bundle.
    Validates structure, uploads to secure storage, computes SHA-256 source hash,
    and commits Application and ApplicationVersion records.
    """
    is_valid, err_msg, source_hash, file_count = validate_zip_archive(zip_bytes, filename)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Archive validation failure: {err_msg}",
        )

    storage = get_storage_service()
    uploaded_key: Optional[str] = None

    try:
        app = Application(
            organisation_id=organisation_id,
            name=name.strip(),
            description=description.strip() if description else None,
            integration_type="zip",
            status="registered",
        )
        db.add(app)
        db.flush()

        version_id = uuid.uuid4()
        uploaded_key = generate_application_storage_key(organisation_id, app.id, version_id)
        storage.upload_file(uploaded_key, zip_bytes)

        version = ApplicationVersion(
            id=version_id,
            application_id=app.id,
            version_label=version_label.strip() or "v1.0.0",
            source_hash=source_hash,
            storage_key=uploaded_key,
        )
        db.add(version)

        # Audit trail
        audit = AuditEvent(
            organisation_id=organisation_id,
            action="APPLICATION_REGISTERED_ZIP",
            resource_type="application",
            resource_id=str(app.id),
            details={
                "name": app.name,
                "version_label": version.version_label,
                "file_count": file_count,
                "source_hash": source_hash,
                "storage_key": uploaded_key,
            },
        )
        db.add(audit)
        db.commit()
        db.refresh(app)
        db.refresh(version)
        return app, version
    except Exception:
        db.rollback()
        if uploaded_key:
            storage.delete_file(uploaded_key)
        raise


def register_api_application(
    db: Session,
    organisation_id: uuid.UUID,
    name: str,
    description: Optional[str],
    target_url: str,
    version_label: str,
) -> Tuple[Application, ApplicationVersion]:
    """
    Registers an AI application targeting an external API endpoint.
    Performs strict SSRF validation and persists metadata.
    """
    is_valid, err_msg = validate_api_target_url(target_url)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"API target validation failure: {err_msg}",
        )

    try:
        app = Application(
            organisation_id=organisation_id,
            name=name.strip(),
            description=description.strip() if description else None,
            integration_type="api",
            status="registered",
        )
        db.add(app)
        db.flush()

        version = ApplicationVersion(
            application_id=app.id,
            version_label=version_label.strip() or "v1.0.0",
            source_hash=None,
        )
        db.add(version)

        # Audit trail
        audit = AuditEvent(
            organisation_id=organisation_id,
            action="APPLICATION_REGISTERED_API",
            resource_type="application",
            resource_id=str(app.id),
            details={
                "name": app.name,
                "target_url": target_url.strip(),
                "version_label": version.version_label,
            },
        )
        db.add(audit)
        db.commit()
        db.refresh(app)
        db.refresh(version)
        return app, version
    except Exception:
        db.rollback()
        raise


def list_applications(
    db: Session,
    organisation_id: Optional[uuid.UUID],
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Application], int]:
    """Lists applications with tenant scoping and pagination."""
    query = db.query(Application)
    if organisation_id is not None:
        query = query.filter(Application.organisation_id == organisation_id)

    total = query.count()
    items = (
        query.order_by(Application.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_application_by_id(
    db: Session,
    application_id: uuid.UUID,
    organisation_id: Optional[uuid.UUID] = None,
) -> Optional[Application]:
    """Retrieves an application by ID with optional tenant restriction."""
    query = db.query(Application).filter(Application.id == application_id)
    if organisation_id is not None:
        query = query.filter(Application.organisation_id == organisation_id)
    return query.first()


def list_application_versions(
    db: Session,
    application_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[ApplicationVersion], int]:
    """Lists version history for a verified application."""
    query = db.query(ApplicationVersion).filter(ApplicationVersion.application_id == application_id)
    total = query.count()
    items = (
        query.order_by(ApplicationVersion.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_application_discovery(
    db: Session,
    app: Application,
) -> Dict[str, Any]:
    """
    Returns application discovery details.
    Derives information reliably from intake metadata.
    """
    # For registered applications in Phase 2, full dynamic AST/model introspection is scheduled for Phase 3.
    # Return documented pending/registered state without fabricating fake tests or endpoints.
    endpoints: List[Dict[str, Any]] = []
    capabilities: List[str] = []

    if app.integration_type == "api":
        capabilities.append("http_rest_target")
        # Read latest audit event if available to find registered target_url
        latest_audit = (
            db.query(AuditEvent)
            .filter(
                AuditEvent.resource_id == str(app.id),
                AuditEvent.action == "APPLICATION_REGISTERED_API",
            )
            .first()
        )
        target_url = latest_audit.details.get("target_url") if latest_audit and latest_audit.details else None
        if target_url:
            endpoints.append({"type": "target_url", "url": target_url})
    elif app.integration_type == "zip":
        capabilities.append("zip_archive_package")

    return {
        "application_id": app.id,
        "status": app.status,
        "integration_type": app.integration_type,
        "target_url": endpoints[0]["url"] if endpoints else None,
        "discovered_endpoints": endpoints,
        "detected_capabilities": capabilities,
        "notes": "Intake registration verified. Comprehensive automated engine discovery is scheduled for execution runs in Phase 3.",
    }

