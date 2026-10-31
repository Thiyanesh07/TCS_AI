"""
Security and cryptographic utilities for QualiTrust AI.
Handles Argon2id password hashing, SHA-256 token hashing, and signed JWT issuance & verification.
"""

import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from app.core.config import settings

# Initialize Argon2id hasher with secure default parameters
_ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def hash_token(token: str) -> str:
    """Compute the SHA-256 cryptographic digest of a token for secure database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_random_token() -> str:
    """Generate a high-entropy cryptographically secure random token string."""
    return secrets.token_urlsafe(48)


def create_access_token(
    user_id: uuid.UUID,
    role: str,
    organisation_id: Optional[uuid.UUID] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Issue a signed JWT access token.
    Claims include sub, role, org_id, iat, exp, jti, and type.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "org_id": str(organisation_id) if organisation_id else None,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a signed JWT access token.
    Enforces signature, expiration, algorithm whitelist, and token type.
    Raises jwt.PyJWTError subclasses on failure.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "type"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload

