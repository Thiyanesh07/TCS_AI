"""
Tests for API contracts, Request ID propagation, and response error envelopes.
"""

from fastapi.testclient import TestClient


def test_custom_request_id_propagation(client: TestClient):
    """When a valid X-Request-ID header is supplied, it must be propagated to response and envelope."""
    custom_id = "test-req-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})

    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
    data = response.json()
    assert data["request_id"] == custom_id


def test_generated_request_id_when_omitted(client: TestClient):
    """When X-Request-ID is omitted, the API must generate a valid UUID and include it in headers and envelope."""
    response = client.get("/health")
    assert response.status_code == 200

    header_id = response.headers.get("X-Request-ID")
    assert header_id is not None
    data = response.json()
    assert data["request_id"] == header_id
    assert len(header_id) >= 16


def test_invalid_request_id_sanitization(client: TestClient):
    """When an unsafe/malformed X-Request-ID is supplied, it is discarded and replaced with a valid UUID."""
    unsafe_id = "<script>alert(1)</script>"
    response = client.get("/health", headers={"X-Request-ID": unsafe_id})

    assert response.status_code == 200
    header_id = response.headers.get("X-Request-ID")
    assert "<script>" not in header_id
    data = response.json()
    assert data["request_id"] == header_id


def test_not_found_error_envelope(client: TestClient):
    """404 Not Found responses must follow the standard error envelope."""
    response = client.get("/api/v1/non-existent-endpoint")
    assert response.status_code == 404

    data = response.json()
    assert "error" in data
    assert "request_id" in data
    assert data["error"]["code"] == "HTTP_404"
    assert response.headers.get("X-Request-ID") == data["request_id"]


def test_openapi_documentation_generation(client: TestClient):
    """OpenAPI JSON spec must be generated with the correct title and endpoints."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()

    assert spec["info"]["title"] == "QualiTrust AI"
    assert "/health" in spec["paths"]
    assert "/api/v1/health" in spec["paths"]
    assert "/api/v1/health/ready" in spec["paths"]

