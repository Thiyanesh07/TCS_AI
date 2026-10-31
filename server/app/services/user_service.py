"""
User provisioning service for QualiTrust AI.
Handles creation of platform administrators and organisation users with Argon2id hashing.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password
from app.models.user import User
from app.models.organisation import Organisation


def create_user(
    db: Session,
    email: str,
    password: str,
    role: str = "ORG_USER",
    organisation_id: Optional[uuid.UUID] = None,
    full_name: Optional[str] = None,
) -> User:
    """Creates a new user record with securely hashed password."""
    clean_email = email.strip().lower()
    if role not in ("PLATFORM_ADMIN", "ORG_USER"):
        raise ValueError("Role must be either 'PLATFORM_ADMIN' or 'ORG_USER'.")

    if role == "ORG_USER" and not organisation_id:
        raise ValueError("Organisation ID is mandatory for ORG_USER accounts.")

    # Check email uniqueness
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    # If organisation_id provided, verify organisation exists
    if organisation_id:
        org = db.query(Organisation).filter(Organisation.id == organisation_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referenced organisation does not exist.",
            )

    user = User(
        email=clean_email,
        hashed_password=hash_password(password),
        role=role,
        organisation_id=organisation_id,
        full_name=full_name.strip() if full_name else None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

