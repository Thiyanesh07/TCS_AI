"""
FastAPI authentication and authorization dependencies for QualiTrust AI.
Enforces JWT validation, role-based access control (PLATFORM_ADMIN, ORG_USER),
and strict organisation-level multi-tenancy boundaries.
"""

import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.core.security import decode_access_token

# Bearer token extractor
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates Bearer access token, decodes claims, and resolves the active user from the database.
    Never trusts client-supplied roles or organisation IDs.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject claim is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject format.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_platform_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Restricts endpoint access strictly to PLATFORM_ADMIN role."""
    if current_user.role != "PLATFORM_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires platform administrator privileges.",
        )
    return current_user


def require_org_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Restricts access to authenticated users possessing an active organisation association."""
    if current_user.role != "ORG_USER" or not current_user.organisation_id:
        # Platform admins may also inspect if needed, otherwise require org association
        if current_user.role != "PLATFORM_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User must belong to an active organisation.",
            )
    return current_user


def enforce_organisation_access(
    user: User,
    resource_org_id: uuid.UUID,
) -> None:
    """
    Enforces multi-tenant isolation.
    If an ORG_USER attempts to access a resource belonging to a different organisation,
    returns 404 Not Found to prevent leaking resource existence.
    """
    if user.role == "PLATFORM_ADMIN":
        return

    if user.organisation_id != resource_org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found.",
        )

