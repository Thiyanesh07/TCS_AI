"""
QualiTrust AI — Live API Adapter Integration Tests
Spins up a local HTTP test server to verify real socket communication, authentication header
propagation, timeouts, error codes, and response extraction against APITargetAdapter.
"""

import time
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import pytest

from shared.schemas.contracts import TestCase, TestCategory
from ai_engine.adapters.api_adapter import APITargetAdapter


class MockAPIServerHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress console logging

    def do_POST(self):
        auth_header = self.headers.get("Authorization", "")
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        # 1. Route: /auth-required
        if self.path == "/auth-required":
            if auth_header != "Bearer valid-token-xyz":
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error": "Unauthorized"}')
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"response": "Authentication successful!"}')
            return

        # 2. Route: /slow-endpoint (Test timeout)
        elif self.path == "/slow-endpoint":
            time.sleep(1.2)  # Delay longer than adapter timeout
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"response": "delayed"}')
            return

        # 3. Route: /server-error
        elif self.path == "/server-error":
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Internal Server Exception"}')
            return

        # 4. Route: /custom-schema
        elif self.path == "/custom-schema":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            resp_payload = {
                "data": {
                    "output_text": "Nested response extracted successfully.",
                    "retrieval_chunks": ["Doc 1 chunk", "Doc 2 chunk"]
                },
                "citations": ["REF-101"]
            }
            self.wfile.write(json.dumps(resp_payload).encode("utf-8"))
            return

        # Default 200 standard endpoint
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"response": "Default successful response"}')


@pytest.fixture(scope="module")
def live_server():
    server = HTTPServer(("127.0.0.1", 0), MockAPIServerHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()


def test_live_api_authentication_success(live_server):
    adapter = APITargetAdapter({
        "base_url": live_server,
        "endpoint_path": "auth-required",
        "auth_token": "valid-token-xyz",
    })
    tc = TestCase(
        title="Auth Test",
        category=TestCategory.FUNCTIONAL,
        input="Ping with auth",
        expected_behaviour="Success",
        evaluation_method="exact_match",
    )
    resp = adapter.execute(tc)
    assert resp.status_code == 200
    assert resp.raw_response == "Authentication successful!"
    assert resp.is_error is False


def test_live_api_authentication_failure(live_server):
    adapter = APITargetAdapter({
        "base_url": live_server,
        "endpoint_path": "auth-required",
        "auth_token": "invalid-token",
    })
    tc = TestCase(
        title="Auth Fail Test",
        category=TestCategory.FUNCTIONAL,
        input="Ping with bad token",
        expected_behaviour="401",
        evaluation_method="status_check",
    )
    resp = adapter.execute(tc)
    assert resp.status_code == 401
    assert resp.is_error is True
    assert "Unauthorized" in resp.error_message


def test_live_api_timeout_enforcement(live_server):
    adapter = APITargetAdapter({
        "base_url": live_server,
        "endpoint_path": "slow-endpoint",
        "timeout_seconds": 0.3,
    })
    tc = TestCase(
        title="Timeout Test",
        category=TestCategory.FUNCTIONAL,
        input="Ping slow server",
        expected_behaviour="Timeout error",
        evaluation_method="timeout_check",
    )
    resp = adapter.execute(tc)
    assert resp.is_error is True
    assert "timed out" in resp.error_message.lower() or "timeout" in resp.error_message.lower()


def test_live_api_server_error_500(live_server):
    adapter = APITargetAdapter({
        "base_url": live_server,
        "endpoint_path": "server-error",
    })
    tc = TestCase(
        title="500 Test",
        category=TestCategory.FUNCTIONAL,
        input="Trigger 500",
        expected_behaviour="Internal error",
        evaluation_method="status_check",
    )
    resp = adapter.execute(tc)
    assert resp.status_code == 500
    assert resp.is_error is True
    assert "Internal Server Exception" in resp.error_message


def test_live_api_nested_response_path(live_server):
    adapter = APITargetAdapter({
        "base_url": live_server,
        "endpoint_path": "custom-schema",
        "response_path": "data",
    })
    tc = TestCase(
        title="Nested Schema Test",
        category=TestCategory.FUNCTIONAL,
        input="Get custom structure",
        expected_behaviour="Extract nested data",
        evaluation_method="json_extract",
    )
    resp = adapter.execute(tc)
    assert resp.status_code == 200
    assert isinstance(resp.raw_response, dict)
    assert resp.raw_response.get("output_text") == "Nested response extracted successfully."
    assert "REF-101" in resp.citations

