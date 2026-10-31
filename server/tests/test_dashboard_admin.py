"""
Automated tests for Dashboard Summary, Dashboard Activity Feed,
and Platform Administration APIs.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.application import Application
from app.models.evaluation_run import EvaluationRun
from app.models.application_version import ApplicationVersion
from app.services.user_service import create_user
from app.core.security import create_access_token


def test_dashboard_summary_and_activity(client: TestClient, db_session: Session):
    """Dashboard summary aggregates real metrics and activity feed from database."""
    org = Organisation(name="Dashboard Org", slug="dashboard-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "dash@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    # Seed an application and version
    app = Application(organisation_id=org.id, name="Dash App", integration_type="api")
    db_session.add(app)
    db_session.commit()

    ver = ApplicationVersion(application_id=app.id, version_label="v1.0")
    db_session.add(ver)
    db_session.commit()

    # Seed an evaluation run with quality score
    run = EvaluationRun(
        application_id=app.id,
        version_id=ver.id,
        status="completed",
        quality_score=94.0,
        release_status="eligible",
    )
    db_session.add(run)
    db_session.commit()

    # Test summary
    sum_res = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sum_res.status_code == 200
    sum_data = sum_res.json()["data"]
    assert sum_data["total_applications"] == 1
    assert sum_data["total_evaluations"] == 1
    assert sum_data["eligible_releases"] == 1
    assert sum_data["blocked_releases"] == 0
    assert sum_data["average_quality_score"] == 94.0

    # Test activity feed
    act_res = client.get(
        "/api/v1/dashboard/activity",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert act_res.status_code == 200
    assert "items" in act_res.json()["data"]


def test_admin_organisation_management(client: TestClient, db_session: Session):
    """Platform admin can list, view, and patch organisation status."""
    admin = create_user(
        db_session,
        "superadmin@platform.ai",
        "AdminPass123!",
        role="PLATFORM_ADMIN",
        organisation_id=None,
    )
    admin_token = create_access_token(admin.id, admin.role, None)

    target_org = Organisation(name="Client Alpha", slug="client-alpha", status="active")
    db_session.add(target_org)
    db_session.commit()

    # 1. Get organisation detail
    detail_res = client.get(
        f"/api/v1/admin/organisations/{target_org.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["slug"] == "client-alpha"
    assert detail_res.json()["data"]["status"] == "active"

    # 2. Patch status to suspended
    patch_res = client.patch(
        f"/api/v1/admin/organisations/{target_org.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "suspended"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["status"] == "suspended"

    # 3. Verify status updated in database
    db_session.refresh(target_org)
    assert target_org.status == "suspended"

