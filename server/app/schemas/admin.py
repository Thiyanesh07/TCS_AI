"""
Platform administration schemas for tenant organisation management.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.application import PaginationMetadata


class OrganisationResponseData(BaseModel):
    """Organisation representation returned to platform administrators."""
    id: uuid.UUID
    name: str
    slug: str
    status: str
    user_count: int = 0
    application_count: int = 0
    created_at: datetime
    updated_at: datetime


class OrganisationStatusUpdateRequest(BaseModel):
    """Payload for updating organisation operational status."""
    status: str = Field(description="Updated status, e.g., 'active' or 'suspended'")


class PaginatedOrganisationsData(BaseModel):
    items: List[OrganisationResponseData]
    pagination: PaginationMetadata

