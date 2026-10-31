"""
Automated tests for Application Registration (ZIP and API Target),
SSRF validation, ZIP Slip / archive bomb prevention, and version retrieval.
"""

import io
import zipfile
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.organisation import Organisation
from app.services.user_service import create_user
from app.core.security import create_access_token


def _create_valid_zip_bytes() -> bytes:
    """Helper creating a minimal valid ZIP archive in-memory."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("app/main.py", "print('Hello QualiTrust')")
        z.writestr("requirements.txt", "fastapi==0.115.0\n")
    return buf.getvalue()


def _create_malicious_zip_bytes() -> bytes:
    """Helper creating a ZIP archive with a directory traversal (Zip Slip) attempt."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("../../../evil.py", "import os; os.system('echo hacked')")
    return buf.getvalue()


def test_register_application_zip_success(client: TestClient, db_session: Session):
    """Registering application with a valid ZIP archive returns 201 and persists application & version."""
    org = Organisation(name="Zip Org", slug="zip-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "zip@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    zip_bytes = _create_valid_zip_bytes()
    response = client.post(
        "/api/v1/applications/zip",
        headers={"Authorization": f"Bearer {token}"},
        data={"name": "My AI Model App", "description": "LLM Service", "version_label": "v1.0.0"},
        files={"file": ("model.zip", zip_bytes, "application/zip")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["data"]["name"] == "My AI Model App"
    assert data["data"]["integration_type"] == "zip"
    assert data["data"]["status"] == "registered"

    app_id = data["data"]["id"]
    # Check versions
    v_res = client.get(
        f"/api/v1/applications/{app_id}/versions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert v_res.status_code == 200
    v_data = v_res.json()["data"]
    assert len(v_data["items"]) == 1
    assert v_data["items"][0]["version_label"] == "v1.0.0"
    assert v_data["items"][0]["source_hash"] is not None


def test_register_application_zip_invalid_file(client: TestClient, db_session: Session):
    """Uploading plain text masquerading as a ZIP fails validation with 422."""
    org = Organisation(name="Zip Org 2", slug="zip-org-2")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "zip2@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    response = client.post(
        "/api/v1/applications/zip",
        headers={"Authorization": f"Bearer {token}"},
        data={"name": "Fake ZIP App"},
        files={"file": ("fake.zip", b"this is not a zip file", "application/zip")},
    )
    assert response.status_code == 422
    assert "validation failure" in response.json()["error"]["message"].lower()


def test_register_application_zip_path_traversal(client: TestClient, db_session: Session):
    """Uploading an archive containing path traversal (Zip Slip) entries is rejected with 422."""
    org = Organisation(name="Zip Org 3", slug="zip-org-3")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "zip3@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    malicious_bytes = _create_malicious_zip_bytes()
    response = client.post(
        "/api/v1/applications/zip",
        headers={"Authorization": f"Bearer {token}"},
        data={"name": "Malicious App"},
        files={"file": ("malicious.zip", malicious_bytes, "application/zip")},
    )
    assert response.status_code == 422
    assert "traversal" in response.json()["error"]["message"].lower()


def test_register_application_api_target_success(client: TestClient, db_session: Session):
    """Registering application with an external HTTPS target URL returns 201."""
    org = Organisation(name="API Org", slug="api-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "api@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    response = client.post(
        "/api/v1/applications/api",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Customer Support LLM API",
            "description": "Hosted LLM endpoint",
            "target_url": "https://api.github.com",
            "version_label": "v1.2.0",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["data"]["name"] == "Customer Support LLM API"
    assert data["data"]["integration_type"] == "api"

    # Check discovery endpoint
    app_id = data["data"]["id"]
    disc_res = client.get(
        f"/api/v1/applications/{app_id}/discovery",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert disc_res.status_code == 200
    disc_data = disc_res.json()["data"]
    assert disc_data["integration_type"] == "api"
    assert disc_data["target_url"] == "https://api.github.com"


def test_register_application_api_target_ssrf_rejection(client: TestClient, db_session: Session):
    """
    SSRF Protection:
    Rejects loopback, private IPs, credentials in URL, and metadata addresses.
    """
    org = Organisation(name="SSRF Org", slug="ssrf-org")
    db_session.add(org)
    db_session.commit()

    user = create_user(db_session, "ssrf@org.com", "Password123!", "ORG_USER", org.id)
    token = create_access_token(user.id, user.role, user.organisation_id)

    dangerous_urls = [
        "http://127.0.0.1:8000/internal",
        "http://localhost:3000",
        "https://169.254.169.254/latest/meta-data/",
        "https://admin:secret@api.github.com",
    ]

    for bad_url in dangerous_urls:
        response = client.post(
            "/api/v1/applications/api",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Dangerous Target",
                "target_url": bad_url,
            },
        )
        assert response.status_code == 422, f"Expected 422 for dangerous URL {bad_url}"
        assert "validation failure" in response.json()["error"]["message"].lower()

