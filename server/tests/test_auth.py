"""
Automated tests for Custom JWT Authentication, password hashing, and token rotation.
"""

from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.user import User
from app.services.user_service import create_user
from app.core.security import create_access_token


def test_login_successful(client: TestClient, db_session: Session):
    """Successful login returns access token and refresh token in standard response envelope."""
    org = Organisation(name="Test Org", slug="test-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="user@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.org", "password": "SecurePassword123!"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "data" in data
    assert "request_id" in data
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "Bearer"
    assert data["data"]["expires_in"] > 0


def test_login_incorrect_password(client: TestClient, db_session: Session):
    """Incorrect password returns 401 with generic error envelope."""
    org = Organisation(name="Test Org 2", slug="test-org-2")
    db_session.add(org)
    db_session.commit()

    create_user(
        db=db_session,
        email="user2@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user2@test.org", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_401"
    assert "Invalid email or password" in data["error"]["message"]


def test_login_nonexistent_email(client: TestClient):
    """Nonexistent email returns identical 401 message (prevents email enumeration)."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@domain.com", "password": "SomePassword"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert "Invalid email or password" in data["error"]["message"]


def test_login_inactive_user(client: TestClient, db_session: Session):
    """Inactive user cannot log in and receives 401."""
    org = Organisation(name="Test Org 3", slug="test-org-3")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="inactive@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
    )
    user.is_active = False
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@test.org", "password": "SecurePassword123!"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client: TestClient, db_session: Session):
    """GET /auth/me returns current user profile with valid Bearer token."""
    org = Organisation(name="Test Org 4", slug="test-org-4")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="profile@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
        full_name="Jane Doe",
    )
    token = create_access_token(user.id, user.role, user.organisation_id)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["email"] == "profile@test.org"
    assert data["data"]["full_name"] == "Jane Doe"
    assert data["data"]["role"] == "ORG_USER"
    assert data["data"]["organisation_id"] == str(org.id)


def test_get_me_unauthorized(client: TestClient):
    """GET /auth/me returns 401 when token is missing or malformed."""
    # Missing token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # Malformed token
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert res2.status_code == 401


def test_get_me_expired_token(client: TestClient, db_session: Session):
    """GET /auth/me returns 401 when token has expired."""
    org = Organisation(name="Test Org 5", slug="test-org-5")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="expired@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
    )
    expired_token = create_access_token(
        user.id, user.role, user.organisation_id, expires_delta=timedelta(seconds=-10)
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "expired" in response.json()["error"]["message"].lower()


def test_refresh_token_rotation_and_reuse_rejection(client: TestClient, db_session: Session):
    """
    Refresh token rotation:
    1. Valid refresh token issues new access and rotated refresh token.
    2. Reusing the old refresh token is detected as a compromise and rejected.
    """
    org = Organisation(name="Test Org 6", slug="test-org-6")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="refresh@test.org",
        password="SecurePassword123!",
        role="ORG_USER",
        organisation_id=org.id,
    )

    # 1. Login to obtain initial refresh token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@test.org", "password": "SecurePassword123!"},
    )
    initial_refresh = login_res.json()["data"]["refresh_token"]

    # 2. Rotate token
    rotate_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert rotate_res.status_code == 200
    rotated_data = rotate_res.json()["data"]
    new_refresh = rotated_data["refresh_token"]
    assert new_refresh != initial_refresh

    # 3. Attempt to reuse initial refresh token -> must be rejected
    reuse_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert reuse_res.status_code == 401

    # 4. Due to reuse compromise detection, even the second token is now invalidated
    comp_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh},
    )
    assert comp_res.status_code == 401


def test_user_provisioning_duplicate_email_fails(db_session: Session):
    """Attempting to provision a duplicate email raises 409 Conflict."""
    import pytest
    from fastapi import HTTPException

    org = Organisation(name="Unique Test Org", slug="unique-test-org")
    db_session.add(org)
    db_session.commit()

    create_user(db_session, "unique@test.org", "Pass123!", "ORG_USER", org.id)
    with pytest.raises(HTTPException) as exc_info:
        create_user(db_session, "unique@test.org", "Pass123!", "ORG_USER", org.id)
    assert exc_info.value.status_code == 409
