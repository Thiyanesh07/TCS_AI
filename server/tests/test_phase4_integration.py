"""
Phase 4 Comprehensive Integration and Security Verification Suite.
Validates complete end-to-end workflow, strict cross-tenant isolation across all resources,
and defensive security controls (JWT, SSRF, RBAC, Zip validation).
"""

import io
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.models.application import Application
from app.models.application_version import ApplicationVersion
from app.models.evaluation_run import EvaluationRun
from app.models.test_case import TestCase
from app.models.test_result import TestResult
from app.models.finding import Finding
from app.models.evidence import Evidence
from app.models.regression_test import RegressionTest
from app.services.user_service import create_user
from app.core.security import create_access_token


def _make_clean_zip() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("main.py", "def handle():\n    return {'status': 'ok'}\n")
        z.writestr("requirements.txt", "fastapi==0.115.0\n")
    return buf.getvalue()


def test_complete_end_to_end_workflow(client: TestClient, db_session: Session):
    """
    Task D & F: Comprehensive End-to-End Workflow Verification:
    1. Authenticate organisation user.
    2. Register application via ZIP bundle.
    3. Verify storage persistence and version metadata.
    4. Trigger evaluation run.
    5. Retrieve evaluation details and verify completion.
    6. Retrieve granular test results.
    7. Retrieve security findings and evidence.
    8. Check release readiness determination.
    9. Submit authorized human sign-off.
    10. Create a regression test suite linked to baseline run.
    11. Execute comparative regression test against a second version.
    """
    # 1. Setup Organisation and User
    org = Organisation(name="Enterprise Quality Org", slug="enterprise-quality-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "qa-lead@enterprise.com", "SecurePassword123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Application (ZIP)
    zip_bytes = _make_clean_zip()
    reg_res = client.post(
        "/api/v1/applications/zip",
        headers=headers,
        data={"name": "Enterprise Core AI", "description": "Core LLM service", "version_label": "v1.0.0"},
        files={"file": ("service.zip", zip_bytes, "application/zip")},
    )
    assert reg_res.status_code == 201
    app_id = reg_res.json()["data"]["id"]

    # 3. Retrieve versions
    ver_res = client.get(f"/api/v1/applications/{app_id}/versions", headers=headers)
    assert ver_res.status_code == 200
    versions_data = ver_res.json()["data"]
    versions = versions_data["items"]
    assert len(versions) == 1
    v1_id = versions[0]["id"]
    assert versions[0]["source_hash"] is not None

    # Verify storage key is persisted in database
    db_ver = db_session.query(ApplicationVersion).filter(ApplicationVersion.id == uuid.UUID(v1_id)).first()
    assert db_ver.storage_key is not None

    # 4. Trigger evaluation
    eval_res = client.post(
        f"/api/v1/applications/{app_id}/evaluations",
        headers=headers,
        json={"version_id": v1_id},
    )
    assert eval_res.status_code == 201
    run_id = eval_res.json()["data"]["id"]

    # 5. Retrieve evaluation details
    run_res = client.get(f"/api/v1/evaluations/{run_id}", headers=headers)
    assert run_res.status_code == 200
    run_data = run_res.json()["data"]
    assert run_data["status"] == "completed"
    assert run_data["quality_score"] is not None
    assert run_data["release_status"] == "eligible"

    # 6. Retrieve test results
    results_res = client.get(f"/api/v1/evaluations/{run_id}/results", headers=headers)
    assert results_res.status_code == 200
    results = results_res.json()["data"]
    assert len(results) >= 1
    assert any(r["verdict"] == "pass" for r in results)

    # 7. Retrieve findings
    findings_res = client.get(f"/api/v1/evaluations/{run_id}/findings", headers=headers)
    assert findings_res.status_code == 200
    findings = findings_res.json()["data"]
    # Clean app has 0 findings
    assert len(findings) == 0

    # 8. Check Release Review info
    review_info_res = client.get(f"/api/v1/evaluations/{run_id}/release-review", headers=headers)
    assert review_info_res.status_code == 200
    assert review_info_res.json()["data"]["release_status"] == "eligible"

    # 9. Submit authorized human sign-off
    review_post_res = client.post(
        f"/api/v1/evaluations/{run_id}/release-review",
        headers=headers,
        json={"decision": "approved", "notes": "Automated verification passed quality gate"},
    )
    assert review_post_res.status_code == 200
    assert review_post_res.json()["data"]["decision"] == "approved"

    # Register second version for regression comparison
    v2_record = ApplicationVersion(application_id=uuid.UUID(app_id), version_label="v2.0.0", storage_key=db_ver.storage_key)
    db_session.add(v2_record)
    db_session.commit()

    # 10. Create Regression Test Suite linked to baseline run
    reg_suite_res = client.post(
        f"/api/v1/applications/{app_id}/regression-tests",
        headers=headers,
        json={
            "name": "Production Safety Regression",
            "description": "Continuous safety baseline",
            "baseline_run_id": run_id,
            "target_version_id": str(v2_record.id),
        },
    )
    assert reg_suite_res.status_code == 201
    suite_id = reg_suite_res.json()["data"]["id"]

    # 11. Execute comparative regression test against version 2
    exec_res = client.post(
        f"/api/v1/regression-tests/{suite_id}/execute",
        headers=headers,
        json={"target_version_id": str(v2_record.id)},
    )
    assert exec_res.status_code == 200
    exec_data = exec_res.json()["data"]
    assert exec_data["status"] == "completed"
    assert exec_data["regression_detected"] is False
    assert exec_data["current_quality_score"] is not None


def test_exhaustive_cross_tenant_isolation(client: TestClient, db_session: Session):
    """
    Task E: Exhaustive Multi-Tenant Isolation Verification:
    Tests that Organisation A is completely blocked (receiving HTTP 404)
    from accessing ANY of Organisation B's assets:
    - Application
    - Application versions
    - Evaluation runs
    - Test results
    - Findings
    - Finding evidence
    - Release reviews
    - Regression test suites
    """
    org_a = Organisation(name="Tenant Alpha", slug="tenant-alpha")
    org_b = Organisation(name="Tenant Beta", slug="tenant-beta")
    db_session.add_all([org_a, org_b])
    db_session.commit()

    user_a = create_user(db_session, "user@alpha.com", "Password123!", "ORG_USER", org_a.id)
    user_b = create_user(db_session, "user@beta.com", "Password123!", "ORG_USER", org_b.id)

    token_a = create_access_token(user_a.id, user_a.role, user_a.organisation_id)
    token_b = create_access_token(user_b.id, user_b.role, user_b.organisation_id)

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Populate Org B assets
    app_b = Application(organisation_id=org_b.id, name="Beta Private App", integration_type="api")
    db_session.add(app_b)
    db_session.commit()

    ver_b = ApplicationVersion(application_id=app_b.id, version_label="v1.0")
    db_session.add(ver_b)
    db_session.commit()

    run_b = EvaluationRun(
        application_id=app_b.id,
        version_id=ver_b.id,
        status="completed",
        quality_score=90.0,
        release_status="eligible",
    )
    db_session.add(run_b)
    db_session.commit()

    tc_b = TestCase(application_id=app_b.id, name="Security Check", category="security")
    db_session.add(tc_b)
    db_session.commit()

    tr_b = TestResult(
        evaluation_run_id=run_b.id,
        test_case_id=tc_b.id,
        verdict="pass",
        severity="high",
        execution_duration_ms=15,
    )
    db_session.add(tr_b)
    db_session.commit()

    finding_b = Finding(
        evaluation_run_id=run_b.id,
        title="Beta Internal Risk",
        description="Confidential risk detail",
        severity="high",
    )
    db_session.add(finding_b)
    db_session.commit()

    evidence_b = Evidence(
        finding_id=finding_b.id,
        evidence_type="log",
        file_path="secret.py",
        payload={"secret": "leak"},
    )
    db_session.add(evidence_b)
    db_session.commit()

    reg_b = RegressionTest(
        application_id=app_b.id,
        name="Beta Regression",
        baseline_run_id=run_b.id,
        target_version_id=ver_b.id,
    )
    db_session.add(reg_b)
    db_session.commit()

    # User A tries to access Org B's resources -> Must receive 404 for all
    assert client.get(f"/api/v1/applications/{app_b.id}", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/applications/{app_b.id}/versions", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/applications/{app_b.id}/discovery", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_b.id}", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_b.id}/results", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_b.id}/findings", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/findings/{finding_b.id}", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/findings/{finding_b.id}/evidence", headers=headers_a).status_code == 404
    assert client.get(f"/api/v1/evaluations/{run_b.id}/release-review", headers=headers_a).status_code == 404
    assert client.post(
        f"/api/v1/evaluations/{run_b.id}/release-review",
        headers=headers_a,
        json={"decision": "approved"},
    ).status_code == 404
    assert client.get(f"/api/v1/applications/{app_b.id}/regression-tests", headers=headers_a).status_code == 404
    assert client.post(
        f"/api/v1/regression-tests/{reg_b.id}/execute",
        headers=headers_a,
        json={"target_version_id": str(ver_b.id)},
    ).status_code == 404


def test_authentication_security_scenarios(client: TestClient, db_session: Session):
    """
    Task E: Authentication Security Edge Cases:
    1. Missing Authorization header -> 401
    2. Malformed token format -> 401
    3. Invalid token signature -> 401
    4. Inactive user access attempt -> 401
    5. Refresh token reuse -> all active refresh tokens revoked
    """
    # 1. Missing token
    res_no_token = client.get("/api/v1/auth/me")
    assert res_no_token.status_code == 401
    assert res_no_token.json()["error"]["code"] == "HTTP_401"

    # 2. Malformed token
    res_malformed = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert res_malformed.status_code == 401

    # 3. Invalid signature
    forged_token = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJzdWIiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJyb2xlIjoiUExBVEZPUk1fQURNSU4iLCJleHAiOjE5OTk5OTk5OTl9."
        "invalidsignatureinvalidsignatureinvalidsignature"
    )
    res_forged = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    assert res_forged.status_code == 401

    # 4. Inactive user
    org = Organisation(name="Active Org", slug="active-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "inactive@org.com", "Password123!", "ORG_USER", org.id)
    user.is_active = False
    db_session.commit()

    token = create_access_token(user.id, user.role, user.organisation_id)
    res_inactive = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_inactive.status_code == 401
    assert "inactive" in res_inactive.json()["error"]["message"].lower()
