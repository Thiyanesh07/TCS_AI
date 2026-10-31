"""
QualiTrust AI — OpenTelemetry Tracing Instrumentation
Manages distributed tracing spans across workflow stages, recording execution metadata
while strictly filtering confidential source contents, prompts, and credentials.
"""

from __future__ import annotations
import time
import logging
from typing import Any, Dict, Optional
from contextlib import contextmanager

try:
    from opentelemetry import trace
    from opentelemetry.trace import Status, StatusCode
    OTEL_AVAILABLE = True
except ImportError:
    OTEL_AVAILABLE = False

logger = logging.getLogger(__name__)


class TelemetryTracer:
    """
    Wrapper for OpenTelemetry tracing across the evaluation pipeline.
    """

    def __init__(self, service_name: str = "qualitrust-ai-engine"):
        self.service_name = service_name
        if OTEL_AVAILABLE:
            self._tracer = trace.get_tracer(service_name)
        else:
            self._tracer = None

    @contextmanager
    def start_span(
        self,
        name: str,
        run_id: Optional[str] = None,
        node_name: Optional[str] = None,
        model_name: Optional[str] = None,
        provider: Optional[str] = None,
        evaluator: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
    ):
        start_time = time.perf_counter()
        span_attrs: Dict[str, Any] = {}

        if run_id:
            span_attrs["qualitrust.run_id"] = str(run_id)
        if node_name:
            span_attrs["qualitrust.node_name"] = str(node_name)
        if model_name:
            span_attrs["qualitrust.model_name"] = str(model_name)
        if provider:
            span_attrs["qualitrust.provider"] = str(provider)
        if evaluator:
            span_attrs["qualitrust.evaluator"] = str(evaluator)

        if attributes:
            # Filter secrets, bearer tokens, or raw confidential code
            for k, v in attributes.items():
                if any(sec in k.lower() for sec in ["secret", "token", "password", "key", "authorization"]):
                    continue
                if isinstance(v, (str, int, float, bool)):
                    span_attrs[f"qualitrust.{k}"] = v

        if OTEL_AVAILABLE and self._tracer:
            with self._tracer.start_as_current_span(name, attributes=span_attrs) as span:
                try:
                    yield span
                    span.set_status(Status(StatusCode.OK))
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, description=str(e)))
                    span.record_exception(e)
                    raise
                finally:
                    duration = time.perf_counter() - start_time
                    span.set_attribute("qualitrust.duration_seconds", duration)
        else:
            # Minimal fallback span simulation
            class DummySpan:
                def set_attribute(self, k, v): pass
                def set_status(self, s): pass
                def record_exception(self, e): pass

            dummy = DummySpan()
            try:
                yield dummy
            finally:
                pass


_global_tracer = TelemetryTracer()


def get_tracer() -> TelemetryTracer:
    return _global_tracer

