"""
Authentication API endpoints for QualiTrust AI.
Handles user login, token refresh, and public profile retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.request_context import get_request_id
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponseData,
    RefreshRequest,
    TokenRefreshResponseData,
    UserProfileResponseData,
)
from app.services.auth_service import authenticate_user, issue_tokens, rotate_refresh_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    summary="User Login",
    description="Authenticates with email and password, issuing signed JWT access and refresh tokens.",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        # Generic error message: never reveal whether the email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token, expires_in = issue_tokens(db, user)
    return {
        "data": LoginResponseData(
            access_token=access_token,
            token_type="Bearer",
            expires_in=expires_in,
            refresh_token=refresh_token,
        ),
        "request_id": get_request_id(),
    }


@router.post(
    "/refresh",
    summary="Refresh Token",
    description="Exchanges an active refresh token for a rotated token pair.",
)
def refresh_token(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    rotated = rotate_refresh_token(db, payload.refresh_token)
    if not rotated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_access_token, new_refresh_token, expires_in = rotated
    return {
        "data": TokenRefreshResponseData(
            access_token=new_access_token,
            token_type="Bearer",
            expires_in=expires_in,
            refresh_token=new_refresh_token,
        ),
        "request_id": get_request_id(),
    }


@router.get(
    "/me",
    summary="Current User Profile",
    description="Returns the authenticated user's public profile.",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "data": UserProfileResponseData(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role,
            organisation_id=current_user.organisation_id,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
        ),
        "request_id": get_request_id(),
    }

