"""
Standard success and error response schemas for QualiTrust AI.
Follows the agreed API envelopes:
Success: {"data": ..., "request_id": "uuid"}
Error: {"error": {"code": "...", "message": "...", "details": [...]}, "request_id": "uuid"}
"""

from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseEnvelope(BaseModel, Generic[T]):
    """Standard success response envelope."""
    data: T
    request_id: str = Field(description="Unique correlation ID for the request")


class ErrorDetail(BaseModel):
    """Specific error detail item (e.g. field validation failure)."""
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class ErrorBody(BaseModel):
    """Error body containing machine-readable code, message, and optional details."""
    code: str
    message: str
    details: List[Any] = Field(default_factory=list)


class ErrorResponseEnvelope(BaseModel):
    """Standard error response envelope."""
    error: ErrorBody
    request_id: str = Field(description="Unique correlation ID for the request")

