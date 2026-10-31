"""
Findings and Evidence API endpoints for QualiTrust AI.
Enforces organisation-level isolation on all defect details and supporting evidence.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.evaluation import FindingResponseData, EvidenceResponseData
from app.services.evaluation_service import get_finding_by_id, get_finding_evidence

router = APIRouter(prefix="/findings", tags=["Findings & Evidence"])


@router.get(
    "/{finding_id}",
    summary="Get Finding Details",
    description="Retrieves defect details by ID, enforcing multi-tenant isolation.",
)
def get_finding(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    finding = get_finding_by_id(db, finding_id, org_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found.",
        )

    return {
        "data": FindingResponseData.model_validate(finding),
        "request_id": get_request_id(),
    }


@router.get(
    "/{finding_id}/evidence",
    summary="Get Finding Evidence",
    description="Retrieves evidence payloads, logs, and artifacts corroborating the specified finding.",
)
def get_evidence(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organisation_id if current_user.role == "ORG_USER" else None
    evidence_list = get_finding_evidence(db, finding_id, org_id)
    return {
        "data": [EvidenceResponseData.model_validate(e) for e in evidence_list],
        "request_id": get_request_id(),
    }

