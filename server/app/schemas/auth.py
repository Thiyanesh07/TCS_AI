"""
Authentication and user profile schemas for QualiTrust AI.
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """User credentials submission schema."""
    email: str = Field(description="User login email address")
    password: str = Field(min_length=1, description="Plaintext password")


class LoginResponseData(BaseModel):
    """Payload returned on successful authentication."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = Field(description="Access token lifespan in seconds")
    refresh_token: str = Field(description="Opaque refresh token for session renewal")


class RefreshRequest(BaseModel):
    """Token renewal request."""
    refresh_token: str = Field(description="Active refresh token")


class TokenRefreshResponseData(BaseModel):
    """Payload returned on successful token rotation."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: str


class UserProfileResponseData(BaseModel):
    """Public user profile."""
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str
    organisation_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

