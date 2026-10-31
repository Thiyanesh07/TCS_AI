"""
Application registration, versioning, and discovery schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class ApplicationApiCreateRequest(BaseModel):
    """External API target registration schema."""
    name: str = Field(min_length=1, max_length=255, description="Application display name")
    description: Optional[str] = Field(default=None, description="Optional application description")
    target_url: str = Field(description="HTTPS URL endpoint of the target AI application")
    version_label: str = Field(default="v1.0.0", min_length=1, max_length=100, description="Version label")


class ApplicationResponseData(BaseModel):
    """Application summary representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organisation_id: uuid.UUID
    name: str
    description: Optional[str] = None
    integration_type: str  # 'zip' or 'api'
    status: str
    created_at: datetime
    updated_at: datetime


class ApplicationVersionResponseData(BaseModel):
    """Application version representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    version_label: str
    source_hash: Optional[str] = None
    created_at: datetime


class ApplicationDiscoveryResponseData(BaseModel):
    """Application component discovery representation."""
    application_id: uuid.UUID
    status: str
    integration_type: str
    target_url: Optional[str] = None
    discovered_endpoints: List[Dict[str, Any]] = Field(default_factory=list)
    detected_capabilities: List[str] = Field(default_factory=list)
    notes: str


class PaginationMetadata(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedApplicationsData(BaseModel):
    items: List[ApplicationResponseData]
    pagination: PaginationMetadata


class PaginatedVersionsData(BaseModel):
    items: List[ApplicationVersionResponseData]
    pagination: PaginationMetadata
