"""
Automated tests for Evaluation Run Lifecycle, AI Engine inspections,
result & finding persistence, and tenant isolation.
"""

import io
import uuid
import zipfile
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.evaluation_run import EvaluationRun
from app.services.user_service import create_user
from app.services.storage_service import get_storage_service, generate_application_storage_key
from app.services.evaluation_service import execute_evaluation_job
from app.core.security import create_access_token


def _create_clean_app_zip() -> bytes:
    """Creates a clean test ZIP archive without vulnerabilities."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("app.py", "def greet(name: str):\n    return f'Hello {name}'\n")
        z.writestr("requirements.txt", "fastapi==0.115.0\n")
    return buf.getvalue()


def _create_vulnerable_app_zip() -> bytes:
    """Creates a ZIP archive containing a hardcoded API key and dangerous eval."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agent.py", "OPENAI_KEY = 'sk-abcdef12345678901234567890'\nresult = eval(user_code)\n")
        z.writestr("prompt.py", "prompt = f'User input: {user_input}'\n")
    return buf.getvalue()


def test_trigger_evaluation_and_duplicate_prevention(client: TestClient, db_session: Session):
    """Triggering evaluation queues a run, and retrying returns the existing active run."""
    org = Organisation(name="Eval Org", slug="eval-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "eval@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    app = Application(organisation_id=org.id, name="Eval App", integration_type="api")
    db_session.add(app)
    db_session.commit()

    ver = ApplicationVersion(application_id=app.id, version_label="v1.0")
    db_session.add(ver)
    db_session.commit()

    # 1. Trigger evaluation
    res1 = client.post(
        f"/api/v1/applications/{app.id}/evaluations",
        headers={"Authorization": f"Bearer {token}"},
        json={"version_id": str(ver.id)},
    )
    assert res1.status_code == 201
    run1_data = res1.json()["data"]

    # 2. Simulate an in-progress active run
    run_record = db_session.query(EvaluationRun).filter(EvaluationRun.id == uuid.UUID(run1_data["id"])).first()
    run_record.status = "running"
    db_session.commit()

    # 3. Trigger again while active -> returns existing run (duplicate prevention)
    res2 = client.post(
        f"/api/v1/applications/{app.id}/evaluations",
        headers={"Authorization": f"Bearer {token}"},
        json={"version_id": str(ver.id)},
    )
    assert res2.status_code == 201
    assert res2.json()["data"]["id"] == run1_data["id"]


def test_evaluation_clean_zip_application(client: TestClient, db_session: Session):
    """Evaluating a clean ZIP application results in 0 critical findings and 'eligible' release status."""
    org = Organisation(name="Clean Org", slug="clean-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "clean@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    # Setup ZIP application in storage
    app = Application(organisation_id=org.id, name="Clean App", integration_type="zip")
    db_session.add(app)
    db_session.commit()

    zip_bytes = _create_clean_app_zip()
    storage = get_storage_service()
    ver_id = uuid.uuid4()
    storage_key = generate_application_storage_key(org.id, app.id, ver_id)
    storage.upload_file(storage_key, zip_bytes)

    ver = ApplicationVersion(id=ver_id, application_id=app.id, version_label="v1.0", storage_key=storage_key)
    db_session.add(ver)
    db_session.commit()

    # Trigger run
    res = client.post(
        f"/api/v1/applications/{app.id}/evaluations",
        headers={"Authorization": f"Bearer {token}"},
        json={"version_id": str(ver.id)},
    )
    run_id = res.json()["data"]["id"]

    # Execute worker synchronously
    execute_evaluation_job(uuid.UUID(run_id))

    # Inspect results
    detail_res = client.get(
        f"/api/v1/evaluations/{run_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_res.status_code == 200
    data = detail_res.json()["data"]
    assert data["status"] == "completed"
    assert data["release_status"] == "eligible"
    assert data["quality_score"] >= 80.0
    assert data["total_tests"] >= 4

    # Check test results
    results_res = client.get(
        f"/api/v1/evaluations/{run_id}/results",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert results_res.status_code == 200
    assert len(results_res.json()["data"]) >= 4


def test_evaluation_vulnerable_zip_application(client: TestClient, db_session: Session):
    """Evaluating a vulnerable ZIP application flags critical finding and blocks release."""
    org = Organisation(name="Vuln Org", slug="vuln-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "vuln@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    app = Application(organisation_id=org.id, name="Vuln App", integration_type="zip")
    db_session.add(app)
    db_session.commit()

    zip_bytes = _create_vulnerable_app_zip()
    storage = get_storage_service()
    ver_id = uuid.uuid4()
    storage_key = generate_application_storage_key(org.id, app.id, ver_id)
    storage.upload_file(storage_key, zip_bytes)

    ver = ApplicationVersion(id=ver_id, application_id=app.id, version_label="v1.0", storage_key=storage_key)
    db_session.add(ver)
    db_session.commit()

    res = client.post(
        f"/api/v1/applications/{app.id}/evaluations",
        headers={"Authorization": f"Bearer {token}"},
        json={"version_id": str(ver.id)},
    )
    run_id = res.json()["data"]["id"]
    execute_evaluation_job(uuid.UUID(run_id))

    detail_res = client.get(
        f"/api/v1/evaluations/{run_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = detail_res.json()["data"]
    assert data["status"] == "completed"
    assert data["release_status"] == "blocked"
    assert data["failed_tests"] > 0

    # Verify findings and evidence
    findings_res = client.get(
        f"/api/v1/evaluations/{run_id}/findings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert findings_res.status_code == 200
    findings = findings_res.json()["data"]
    assert len(findings) >= 2
    critical_f = [f for f in findings if f["severity"] == "critical"]
    assert len(critical_f) >= 1

    # Check evidence endpoint
    finding_id = critical_f[0]["id"]
    ev_res = client.get(
        f"/api/v1/findings/{finding_id}/evidence",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ev_res.status_code == 200
    assert len(ev_res.json()["data"]) >= 1


def test_cross_tenant_evaluation_isolation(client: TestClient, db_session: Session):
    """Users cannot inspect evaluations, results, or findings belonging to another organisation."""
    org_a = Organisation(name="Eval Org A", slug="eval-org-a")
    org_b = Organisation(name="Eval Org B", slug="eval-org-b")
    db_session.add_all([org_a, org_b])
    db_session.commit()

    user_a = create_user(db_session, "a@eval.com", "Password123!", "ORG_USER", org_a.id)
    user_b = create_user(db_session, "b@eval.com", "Password123!", "ORG_USER", org_b.id)

    token_a = create_access_token(user_a.id, user_a.role, user_a.organisation_id)
    token_b = create_access_token(user_b.id, user_b.role, user_b.organisation_id)

    app_b = Application(organisation_id=org_b.id, name="Org B Target", integration_type="api")
    db_session.add(app_b)
    db_session.commit()

    ver_b = ApplicationVersion(application_id=app_b.id, version_label="v1.0")
    db_session.add(ver_b)
    db_session.commit()

    # User B triggers evaluation
    res_b = client.post(
        f"/api/v1/applications/{app_b.id}/evaluations",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"version_id": str(ver_b.id)},
    )
    run_id = res_b.json()["data"]["id"]

    # User A attempts to view Org B's evaluation -> 404
    assert client.get(f"/api/v1/evaluations/{run_id}", headers={"Authorization": f"Bearer {token_a}"}).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_id}/results", headers={"Authorization": f"Bearer {token_a}"}).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_id}/findings", headers={"Authorization": f"Bearer {token_a}"}).status_code == 404
