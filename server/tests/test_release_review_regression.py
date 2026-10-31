"""
Automated tests for Release Reviews and Regression Testing workflows.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.evaluation_run import EvaluationRun
from app.services.user_service import create_user
from app.core.security import create_access_token


def test_release_review_workflow(client: TestClient, db_session: Session):
    """
    Release Review Workflow:
    1. Cannot approve a blocked run (deterministic policy rule).
    2. Can reject a blocked run.
    3. Can approve an eligible run.
    """
    org = Organisation(name="Review Org", slug="review-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "reviewer@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    app = Application(organisation_id=org.id, name="Review App", integration_type="api")
    db_session.add(app)
    db_session.commit()

    ver = ApplicationVersion(application_id=app.id, version_label="v1.0")
    db_session.add(ver)
    db_session.commit()

    # Blocked run
    blocked_run = EvaluationRun(
        application_id=app.id,
        version_id=ver.id,
        status="completed",
        quality_score=45.0,
        release_status="blocked",
    )
    # Eligible run
    eligible_run = EvaluationRun(
        application_id=app.id,
        version_id=ver.id,
        status="completed",
        quality_score=92.0,
        release_status="eligible",
    )
    db_session.add_all([blocked_run, eligible_run])
    db_session.commit()

    # 1. Attempt to approve blocked run -> must be rejected with 400
    res_bad = client.post(
        f"/api/v1/evaluations/{blocked_run.id}/release-review",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "approved", "notes": "Looks good to me"},
    )
    assert res_bad.status_code == 400
    assert "cannot approve release" in res_bad.json()["error"]["message"].lower()

    # 2. Reject blocked run -> succeeds
    res_reject = client.post(
        f"/api/v1/evaluations/{blocked_run.id}/release-review",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "rejected", "notes": "Critical issues present"},
    )
    assert res_reject.status_code == 200
    assert res_reject.json()["data"]["decision"] == "rejected"

    # 3. Approve eligible run -> succeeds
    res_ok = client.post(
        f"/api/v1/evaluations/{eligible_run.id}/release-review",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "approved", "notes": "Meets quality bar"},
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["data"]["decision"] == "approved"

    # 4. Check GET /evaluations/{id}/release-review
    info_res = client.get(
        f"/api/v1/evaluations/{eligible_run.id}/release-review",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert info_res.status_code == 200
    info_data = info_res.json()["data"]
    assert info_data["review"]["decision"] == "approved"


def test_regression_test_workflow(client: TestClient, db_session: Session):
    """Creating and executing a regression test suite against versions."""
    org = Organisation(name="Reg Org", slug="reg-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "reg@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    app = Application(organisation_id=org.id, name="Reg App", integration_type="api")
    db_session.add(app)
    db_session.commit()

    ver1 = ApplicationVersion(application_id=app.id, version_label="v1.0")
    ver2 = ApplicationVersion(application_id=app.id, version_label="v2.0")
    db_session.add_all([ver1, ver2])
    db_session.commit()

    # Baseline run
    baseline = EvaluationRun(
        application_id=app.id,
        version_id=ver1.id,
        status="completed",
        quality_score=95.0,
        release_status="eligible",
    )
    db_session.add(baseline)
    db_session.commit()

    # 1. Create regression test
    create_res = client.post(
        f"/api/v1/applications/{app.id}/regression-tests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Release v2.0 Regression Suite",
            "baseline_run_id": str(baseline.id),
            "target_version_id": str(ver2.id),
        },
    )
    assert create_res.status_code == 201
    reg_id = create_res.json()["data"]["id"]

    # 2. List regression tests
    list_res = client.get(
        f"/api/v1/applications/{app.id}/regression-tests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1
    assert list_res.json()["data"][0]["name"] == "Release v2.0 Regression Suite"

