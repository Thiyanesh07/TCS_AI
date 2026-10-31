"""
Unit and integration tests for health endpoints.
"""

from unittest.mock import patch
from fastapi.testclient import TestClient


def test_root_health_liveness(client: TestClient):
    """Verify GET /health returns 200, valid envelope, and correct service name."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert "data" in data
    assert "request_id" in data
    assert data["data"]["status"] == "healthy"
    assert data["data"]["service"] == "QualiTrust AI Backend"
    assert response.headers.get("X-Request-ID") == data["request_id"]


def test_api_v1_health_liveness(client: TestClient):
    """Verify GET /api/v1/health conforms to the API v1 prefix and envelope contract."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert "data" in data
    assert "request_id" in data
    assert data["data"]["status"] == "healthy"
    assert response.headers.get("X-Request-ID") == data["request_id"]


def test_api_v1_health_readiness_healthy(client: TestClient):
    """Verify GET /api/v1/health/ready returns 200 and healthy status when database is reachable."""
    with patch("app.api.health.check_database_connectivity", return_value=(True, "Database connected")):
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()

        assert "data" in data
        assert data["data"]["status"] == "ready"
        assert data["data"]["dependencies"]["database"]["status"] == "healthy"
        assert response.headers.get("X-Request-ID") == data["request_id"]


def test_api_v1_health_readiness_unhealthy(client: TestClient):
    """Verify GET /api/v1/health/ready returns 503 and error envelope when database check fails."""
    with patch("app.api.health.check_database_connectivity", return_value=(False, "Database unreachable")):
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503
        data = response.json()

        assert "error" in data
        assert data["error"]["code"] == "SERVICE_UNAVAILABLE"
        assert "details" in data["error"]
        assert data["error"]["details"][0]["component"] == "database"
        assert response.headers.get("X-Request-ID") == data["request_id"]

