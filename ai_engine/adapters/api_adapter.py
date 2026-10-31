"""
QualiTrust AI — HTTP API Target Adapter
Executes test cases against target AI endpoints using HTTPX with timeout, retry, and auth headers.
"""

from __future__ import annotations
import time
import json
import logging
from typing import Any, Dict, Optional, List
import httpx
from shared.schemas.contracts import TestCase
from ai_engine.adapters.base import BaseTargetAdapter, TargetResponse

logger = logging.getLogger(__name__)


class APITargetAdapter(BaseTargetAdapter):
    def __init__(self, api_config: Dict[str, Any]):
        self.api_config = api_config
        full_url = api_config.get("endpoint_url") or api_config.get("target_url")
        if full_url:
            self.base_url = full_url.rstrip("/")
            self.endpoint_path = ""
        else:
            self.base_url = api_config.get("base_url", "").rstrip("/")
            self.endpoint_path = api_config.get("endpoint_path", "").lstrip("/")

        self.method = api_config.get("http_method", "POST").upper()
        self.headers = api_config.get("headers", {})
        self.auth_token = api_config.get("auth_token")
        self.timeout = float(api_config.get("timeout_seconds", 30.0))
        self.request_schema = api_config.get("request_schema", {})
        self.response_path = api_config.get("response_path", "response")
        self.bot_mode = api_config.get("bot_mode", "good_bot")

    def execute(self, test_case: TestCase) -> TargetResponse:
        url = self.base_url
        if self.endpoint_path:
            url = f"{self.base_url}/{self.endpoint_path}"

        req_headers = dict(self.headers)
        if self.auth_token:
            req_headers["Authorization"] = f"Bearer {self.auth_token}"
        req_headers["Content-Type"] = "application/json"

        # Format input payload
        if "sandbox/execute" in url:
            payload = {
                "test_case_id": str(test_case.id),
                "input": str(test_case.input),
                "bot": self.bot_mode,
                "category": test_case.category.value if hasattr(test_case.category, "value") else str(test_case.category),
            }
        elif isinstance(test_case.input, dict):
            payload = test_case.input
        elif isinstance(test_case.input, list):
            payload = {"messages": test_case.input}
        else:
            payload = {
                "input": str(test_case.input),
                "prompt": str(test_case.input),
                "query": str(test_case.input),
            }

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                if self.method == "POST":
                    resp = client.post(url, headers=req_headers, json=payload)
                elif self.method == "GET":
                    resp = client.get(url, headers=req_headers, params=payload)
                else:
                    resp = client.request(self.method, url, headers=req_headers, json=payload)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            if resp.status_code >= 400:
                return TargetResponse(
                    raw_response=resp.text,
                    latency_ms=elapsed_ms,
                    status_code=resp.status_code,
                    is_error=True,
                    error_message=f"HTTP Error {resp.status_code}: {resp.text}",
                )

            try:
                data = resp.json()
                if isinstance(data, dict):
                    raw = (
                        data.get("output")
                        or data.get(self.response_path)
                        or data.get("response")
                        or data.get("answer")
                        or data
                    )
                    ctx = data.get("retrieved_context") or data.get("context")
                    citations = data.get("citations", [])
                else:
                    raw = data
                    ctx = None
                    citations = []
            except Exception:
                raw = resp.text
                ctx = None
                citations = []

            return TargetResponse(
                raw_response=raw,
                latency_ms=elapsed_ms,
                status_code=resp.status_code,
                retrieved_context=ctx,
                citations=citations,
            )

        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Target API invocation failed: {e}")
            return TargetResponse(
                raw_response="",
                latency_ms=elapsed_ms,
                status_code=500,
                is_error=True,
                error_message=str(e),
            )
