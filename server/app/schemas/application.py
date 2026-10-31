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
    target_url: Optional[str] = Field(default=None, description="HTTPS URL endpoint of the target AI application")
    baseUrl: Optional[str] = Field(default=None, description="Base URL of target API")
    endpointPath: Optional[str] = Field(default=None, description="Endpoint path")
    version_label: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Version label")
    version: Optional[str] = Field(default=None, description="Alternative version label")

    def get_target_url(self) -> str:
        if self.target_url:
            return self.target_url
        if self.baseUrl:
            path = (self.endpointPath or "").lstrip("/")
            base = self.baseUrl.rstrip("/")
            return f"{base}/{path}" if path else base
        raise ValueError("Either target_url or baseUrl must be provided.")

    def get_version_label(self) -> str:
        return self.version_label or self.version or "v1.0.0" 


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
