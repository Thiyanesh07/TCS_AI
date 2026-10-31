"""
QualiTrust AI — Unified End-to-End Pipeline Integration Test
Verifies complete flow across Auth -> Application Registration -> Evaluation Trigger ->
Evaluation Execution -> Results & Findings retrieval.
"""

import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.organisation import Organisation
from app.services.user_service import create_user
from app.services.evaluation_service import execute_evaluation_job


def test_unified_end_to_end_flow(client: TestClient, db_session: Session):
    """Executes a full lifecycle test through public API endpoints."""
    settings.ALLOW_INSECURE_TARGET_URLS = True

    # 1. Tenant & User Setup
    org = Organisation(name="Unified Enterprise", slug="unified-ent")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "qa-lead@unified.io", "SecurePassword123!", "ORG_USER", org.id)

    # 2. Authenticate
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "qa-lead@unified.io", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Register Application
    app_res = client.post(
        "/api/v1/applications/api",
        headers=auth_headers,
        json={
            "name": "Production Support Copilot",
            "description": "Internal Customer Regulations Assistant",
            "version_label": "v1.0.0",
            "target_url": "http://127.0.0.1:8001/sandbox/execute",
        },
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["data"]["id"]

    # 4. Trigger Evaluation Run
    eval_res = client.post(
        f"/api/v1/applications/{app_id}/evaluations",
        headers=auth_headers,
        json={},
    )
    assert eval_res.status_code == 201
    run_id = eval_res.json()["data"]["id"]

    # 5. Execute Evaluation Worker
    execute_evaluation_job(uuid.UUID(run_id))

    # 6. Verify Completed Run
    detail_res = client.get(
        f"/api/v1/evaluations/{run_id}",
        headers=auth_headers,
    )
    assert detail_res.status_code == 200
    run_data = detail_res.json()["data"]
    assert run_data["status"] == "completed"
    assert run_data["quality_score"] is not None
    assert run_data["total_tests"] >= 2

    # 7. Verify Test Results
    results_res = client.get(
        f"/api/v1/evaluations/{run_id}/results",
        headers=auth_headers,
    )
    assert results_res.status_code == 200
    results_data = results_res.json()["data"]
    assert len(results_data) >= 2

    # 8. Verify Findings
    findings_res = client.get(
        f"/api/v1/evaluations/{run_id}/findings",
        headers=auth_headers,
    )
    assert findings_res.status_code == 200

