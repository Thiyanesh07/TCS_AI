"""
Request context management using Python's contextvars.
Maintains request-scoped correlation/request IDs for logging and API envelope construction.
"""

from contextvars import ContextVar
from typing import Optional
import uuid
import re

_request_id_ctx_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

# Pattern for validating incoming request IDs: alphanumeric, dashes, underscores, 8-64 chars
SAFE_REQUEST_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{8,64}$")


def get_request_id() -> str:
    """Retrieve the current request ID from context or generate a new one if unset."""
    req_id = _request_id_ctx_var.get()
    if not req_id:
        req_id = str(uuid.uuid4())
        _request_id_ctx_var.set(req_id)
    return req_id


def set_request_id(incoming_id: Optional[str] = None) -> str:
    """Validate incoming request ID or generate a new UUID4, and set it in context."""
    if incoming_id and SAFE_REQUEST_ID_REGEX.match(incoming_id):
        clean_id = incoming_id
    else:
        clean_id = str(uuid.uuid4())
    _request_id_ctx_var.set(clean_id)
    return clean_id

