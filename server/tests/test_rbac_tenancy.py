"""
Automated tests for Role-Based Access Control and Organisation Multi-Tenancy isolation.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.application import Application
from app.services.user_service import create_user
from app.core.security import create_access_token


def test_org_user_cannot_access_platform_admin_endpoints(client: TestClient, db_session: Session):
    """ORG_USER receives 403 Forbidden when calling admin routes."""
    org = Organisation(name="Tenant Org", slug="tenant-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(
        db=db_session,
        email="orguser@tenant.org",
        password="Password123!",
        role="ORG_USER",
        organisation_id=org.id,
    )
    token = create_access_token(user.id, user.role, user.organisation_id)

    response = client.get(
        "/api/v1/admin/organisations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "HTTP_403"


def test_platform_admin_can_access_admin_endpoints(client: TestClient, db_session: Session):
    """PLATFORM_ADMIN can list organisations and view platform details."""
    admin = create_user(
        db=db_session,
        email="admin@platform.ai",
        password="AdminPassword123!",
        role="PLATFORM_ADMIN",
        organisation_id=None,
    )
    token = create_access_token(admin.id, admin.role, None)

    response = client.get(
        "/api/v1/admin/organisations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data["data"]
    assert "pagination" in data["data"]


def test_cross_tenant_application_isolation(client: TestClient, db_session: Session):
    """
    Tenant Isolation:
    Organisation A cannot view or access Organisation B's application records.
    Returns 404 to avoid disclosing existence of other tenants' assets.
    """
    # Org A & User A
    org_a = Organisation(name="Organisation A", slug="org-a")
    # Org B & User B
    org_b = Organisation(name="Organisation B", slug="org-b")
    db_session.add_all([org_a, org_b])
    db_session.commit()

    user_a = create_user(db_session, "user.a@org-a.com", "Password123!", "ORG_USER", org_a.id)
    user_b = create_user(db_session, "user.b@org-b.com", "Password123!", "ORG_USER", org_b.id)

    token_a = create_access_token(user_a.id, user_a.role, user_a.organisation_id)
    token_b = create_access_token(user_b.id, user_b.role, user_b.organisation_id)

    # Application created by Org B
    app_b = Application(
        organisation_id=org_b.id,
        name="Org B Confidential App",
        integration_type="api",
        status="registered",
    )
    db_session.add(app_b)
    db_session.commit()

    # 1. User B can access their own application
    res_b = client.get(
        f"/api/v1/applications/{app_b.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_b.status_code == 200
    assert res_b.json()["data"]["name"] == "Org B Confidential App"

    # 2. User A attempts to access Org B's application -> must receive 404
    res_a = client.get(
        f"/api/v1/applications/{app_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a.status_code == 404

    # 3. User A attempts to access Org B's versions -> must receive 404
    res_a_vers = client.get(
        f"/api/v1/applications/{app_b.id}/versions",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a_vers.status_code == 404

    # 4. User A attempts to access Org B's discovery -> must receive 404
    res_a_disc = client.get(
        f"/api/v1/applications/{app_b.id}/discovery",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a_disc.status_code == 404


def test_tenant_application_listing_is_scoped(client: TestClient, db_session: Session):
    """Application list only returns items owned by the authenticated user's organisation."""
    org1 = Organisation(name="Scope Org 1", slug="scope-org-1")
    org2 = Organisation(name="Scope Org 2", slug="scope-org-2")
    db_session.add_all([org1, org2])
    db_session.commit()

    user1 = create_user(db_session, "u1@scope1.com", "Pass123!", "ORG_USER", org1.id)
    token1 = create_access_token(user1.id, user1.role, user1.organisation_id)

    app1 = Application(organisation_id=org1.id, name="App 1", integration_type="api")
    app2 = Application(organisation_id=org2.id, name="App 2", integration_type="api")
    db_session.add_all([app1, app2])
    db_session.commit()

    response = client.get(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "App 1"

