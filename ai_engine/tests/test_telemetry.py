"""
QualiTrust AI — OpenTelemetry Instrumentation & Redaction Tests
Verifies span lifecycle, attribute recording, and redaction of credentials and secrets.
"""

import pytest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from ai_engine.telemetry.tracer import TelemetryTracer


def test_telemetry_span_capture_and_redaction():
    # Setup in-memory exporter
    provider = TracerProvider()
    exporter = InMemorySpanExporter()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    telemetry = TelemetryTracer("test-tracer")

    # Start span with normal and sensitive attributes
    with telemetry.start_span(
        "stage_evaluation_test",
        run_id="run-uuid-1234",
        node_name="test_execution",
        provider="mock",
        model_name="mock-v1",
        evaluator="deterministic_check",
        attributes={
            "app_domain": "Finance",
            "sample_size": 10,
            "secret_api_key": "sk-live-secret-never-log-this",
            "bearer_token": "Bearer token-value",
            "password_raw": "admin123",
        },
    ):
        pass  # Span executed

    spans = exporter.get_finished_spans()
    assert len(spans) >= 1
    span = spans[-1]

    # Verify standard attributes recorded
    assert span.attributes.get("qualitrust.run_id") == "run-uuid-1234"
    assert span.attributes.get("qualitrust.node_name") == "test_execution"
    assert span.attributes.get("qualitrust.provider") == "mock"
    assert span.attributes.get("qualitrust.app_domain") == "Finance"
    assert span.attributes.get("qualitrust.sample_size") == 10
    assert "qualitrust.duration_seconds" in span.attributes

    # Verify sensitive attributes were strictly REDACTED
    assert "qualitrust.secret_api_key" not in span.attributes
    assert "qualitrust.bearer_token" not in span.attributes
    assert "qualitrust.password_raw" not in span.attributes

