"""
Authentication service for QualiTrust AI.
Handles credential verification, user resolution, and refresh token rotation.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    generate_random_token,
    hash_token,
)
from app.models.user import User
from app.models.refresh_token import RefreshToken


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> Optional[User]:
    """
    Verifies user credentials.
    Returns the User if email and password match and user is active, else None.
    Never exposes whether an email address exists.
    """
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def issue_tokens(
    db: Session,
    user: User,
) -> Tuple[str, str, int]:
    """
    Issues a new access token and a persisted refresh token for an authenticated user.
    Returns: (access_token, raw_refresh_token, expires_in_seconds)
    """
    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        organisation_id=user.organisation_id,
    )

    raw_refresh_token = generate_random_token()
    token_digest = hash_token(raw_refresh_token)

    now = datetime.now(timezone.utc)
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=token_digest,
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now,
    )
    db.add(refresh_record)
    db.commit()

    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return access_token, raw_refresh_token, expires_in_seconds


def rotate_refresh_token(
    db: Session,
    raw_refresh_token: str,
) -> Optional[Tuple[str, str, int]]:
    """
    Rotates an active refresh token:
    1. Looks up the token by hash.
    2. Enforces reuse detection: if a revoked token is presented, all user sessions are revoked.
    3. Checks expiration and revocation status.
    4. Issues a new token pair and revokes the old refresh token.
    Returns (access_token, new_raw_refresh_token, expires_in_seconds) or None on failure.
    """
    token_digest = hash_token(raw_refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_digest).first()

    if not record:
        return None

    now = datetime.now(timezone.utc)

    # Reuse detection: Token has already been revoked!
    if record.revoked_at is not None:
        # Compromise detected: invalidate all refresh tokens for this user
        db.query(RefreshToken).filter(
            RefreshToken.user_id == record.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.commit()
        return None

    # Check expiration
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        record.revoked_at = now
        db.commit()
        return None

    # Retrieve user
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        record.revoked_at = now
        db.commit()
        return None

    # Revoke current token
    record.revoked_at = now

    # Issue new token pair
    new_access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        organisation_id=user.organisation_id,
    )
    new_raw_refresh = generate_random_token()
    new_digest = hash_token(new_raw_refresh)

    new_record = RefreshToken(
        user_id=user.id,
        token_hash=new_digest,
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now,
    )
    db.add(new_record)
    db.commit()

    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return new_access_token, new_raw_refresh, expires_in_seconds
