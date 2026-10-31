"""
QualiTrust AI — Mock / Synthetic Target Adapter
Configurable target adapter for unit testing, reproducible benchmarks, and controlled failure simulations.
"""

from __future__ import annotations
import time
from typing import Any, Callable, Dict, List, Optional
from shared.schemas.contracts import TestCase
from ai_engine.adapters.base import BaseTargetAdapter, TargetResponse


class MockTargetAdapter(BaseTargetAdapter):
    def __init__(self, default_response: str = "Standard expected response from mock application."):
        self.default_response = default_response
        self._input_patterns: Dict[str, TargetResponse] = {}
        self._dynamic_handler: Optional[Callable[[TestCase], TargetResponse]] = None

    def register_mock_response(
        self,
        input_substring: str,
        response_text: str,
        latency_ms: float = 85.0,
        status_code: int = 200,
        retrieved_context: Optional[str] = None,
        citations: Optional[List[str]] = None,
        is_error: bool = False,
    ):
        self._input_patterns[input_substring.lower()] = TargetResponse(
            raw_response=response_text,
            latency_ms=latency_ms,
            status_code=status_code,
            retrieved_context=retrieved_context,
            citations=citations or [],
            is_error=is_error,
        )

    def set_dynamic_handler(self, handler: Callable[[TestCase], TargetResponse]):
        self._dynamic_handler = handler

    def execute(self, test_case: TestCase) -> TargetResponse:
        if self._dynamic_handler:
            return self._dynamic_handler(test_case)

        input_str = str(test_case.input).lower().strip()
        if not input_str and "__empty__" in self._input_patterns:
            return self._input_patterns["__empty__"]

        for pattern, mock_resp in self._input_patterns.items():
            if pattern and pattern in input_str:
                return mock_resp

        return TargetResponse(
            raw_response=self.default_response,
            latency_ms=65.0,
            status_code=200,
            retrieved_context="Default mock context chunk.",
            citations=["REF-001"],
        )
