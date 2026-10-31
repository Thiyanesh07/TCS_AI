"""
Release review schemas for QualiTrust AI.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ReleaseReviewSubmitRequest(BaseModel):
    """Release sign-off submission."""
    decision: str = Field(description="Decision: 'approved', 'rejected', or 'conditionally_approved'")
    notes: Optional[str] = Field(default=None, description="Review notes or justifications")


class ReleaseReviewResponseData(BaseModel):
    """Persisted release review record."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evaluation_run_id: uuid.UUID
    reviewer_user_id: Optional[uuid.UUID] = None
    decision: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReleaseReviewInfoData(BaseModel):
    """Comprehensive release review and evaluation status overview."""
    evaluation_run_id: uuid.UUID
    application_id: uuid.UUID
    status: str
    quality_score: Optional[float] = None
    release_status: str
    review: Optional[Dict[str, Any]] = None

