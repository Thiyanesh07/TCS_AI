"""
QualiTrust AI — Docker Sandbox & Archive Inspection Adapter
Provides safe archive inspection (ZipSlip prevention, size quotas, binary filtering)
and isolated sandbox execution with clear daemon availability tracking.
"""

from __future__ import annotations
import os
import time
import zipfile
import subprocess
import logging
from typing import Any, Dict, List, Optional
import httpx
from shared.schemas.contracts import TestCase
from ai_engine.adapters.base import BaseTargetAdapter, TargetResponse

logger = logging.getLogger(__name__)


class ArchiveSecurityError(Exception):
    """Raised when an uploaded archive violates security boundaries."""
    pass


class SafeArchiveInspector:
    """
    Safely inspects and extracts untrusted application ZIP archives.
    Enforces ZipSlip protection, compression ratio quotas, and executable blocklists.
    """

    MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024  # 50 MB
    MAX_FILE_COUNT = 1000
    BLOCKED_EXTENSIONS = {".exe", ".dll", ".so", ".dylib", ".bat", ".vbs", ".cmd"}

    @classmethod
    def inspect_archive(cls, zip_path: str) -> Dict[str, Any]:
        if not os.path.exists(zip_path):
            raise FileNotFoundError(f"Archive not found at: {zip_path}")

        total_size = 0
        file_count = 0
        detected_extensions = set()
        suspicious_files = []

        with zipfile.ZipFile(zip_path, "r") as zf:
            for info in zf.infolist():
                file_count += 1
                total_size += info.file_size

                # Check max files limit
                if file_count > cls.MAX_FILE_COUNT:
                    raise ArchiveSecurityError(f"Archive exceeds maximum file count limit ({cls.MAX_FILE_COUNT})")

                # Check max uncompressed size
                if total_size > cls.MAX_UNCOMPRESSED_BYTES:
                    raise ArchiveSecurityError(f"Archive exceeds maximum uncompressed size ({cls.MAX_UNCOMPRESSED_BYTES} bytes)")

                # Check path traversal (ZipSlip)
                norm_name = os.path.normpath(info.filename)
                if norm_name.startswith("..") or os.path.isabs(norm_name):
                    raise ArchiveSecurityError(f"Directory traversal detected in archive entry: {info.filename}")

                ext = os.path.splitext(info.filename)[1].lower()
                if ext:
                    detected_extensions.add(ext)
                if ext in cls.BLOCKED_EXTENSIONS:
                    suspicious_files.append(info.filename)

        return {
            "valid": True,
            "file_count": file_count,
            "total_uncompressed_bytes": total_size,
            "detected_extensions": list(detected_extensions),
            "suspicious_files": suspicious_files,
            "has_blocked_binaries": len(suspicious_files) > 0,
        }

    @classmethod
    def safe_extract(cls, zip_path: str, extract_to_dir: str) -> None:
        cls.inspect_archive(zip_path)
        os.makedirs(extract_to_dir, exist_ok=True)
        dest_abs = os.path.abspath(extract_to_dir)

        with zipfile.ZipFile(zip_path, "r") as zf:
            for member in zf.infolist():
                target_path = os.path.abspath(os.path.join(dest_abs, member.filename))
                if not target_path.startswith(dest_abs + os.path.sep) and target_path != dest_abs:
                    raise ArchiveSecurityError(f"Path traversal attempted: {member.filename}")
                zf.extract(member, dest_abs)


class SandboxTargetAdapter(BaseTargetAdapter):
    """
    Adapter that executes test cases inside an isolated container sandbox.
    Explicitly detects whether Docker daemon is active or in fallback-simulated mode.
    """

    def __init__(
        self,
        sandbox_url: str = "http://127.0.0.1:8080/sandbox/execute",
        timeout: float = 30.0,
    ):
        self.sandbox_url = sandbox_url
        self.timeout = timeout
        self.docker_status = self._check_docker_daemon()

    def _check_docker_daemon(self) -> Dict[str, Any]:
        """Checks if Docker daemon is running locally."""
        try:
            res = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if res.returncode == 0:
                return {"daemon_available": True, "mode": "docker_container"}
            return {
                "daemon_available": False,
                "mode": "fallback_simulated",
                "error": "Docker daemon offline or unresponsive",
            }
        except Exception as e:
            return {
                "daemon_available": False,
                "mode": "fallback_simulated",
                "error": str(e),
            }

    def execute(self, test_case: TestCase) -> TargetResponse:
        start_time = time.perf_counter()

        # If Docker daemon is offline or sandbox endpoint fails, return controlled simulated execution
        if not self.docker_status.get("daemon_available", False):
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return TargetResponse(
                raw_response=f"Controlled simulated sandbox output for test: {test_case.title}",
                latency_ms=elapsed_ms,
                status_code=200,
                metadata={
                    "sandbox_mode": "fallback_simulated",
                    "docker_daemon": "offline",
                    "isolation_guarantee": "deterministic_simulation",
                },
            )

        payload = {
            "test_case_id": str(test_case.id),
            "input": test_case.input,
            "category": test_case.category.value,
            "constraints": test_case.execution_constraints,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(self.sandbox_url, json=payload)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            if resp.status_code != 200:
                return TargetResponse(
                    raw_response="",
                    latency_ms=elapsed_ms,
                    status_code=resp.status_code,
                    is_error=True,
                    error_message=f"Sandbox error: {resp.text}",
                )

            data = resp.json()
            ctx_raw = data.get("retrieved_context")
            ctx_str = "\n\n".join(ctx_raw) if isinstance(ctx_raw, list) else (str(ctx_raw) if ctx_raw is not None else None)
            citations_raw = data.get("citations", [])
            citations_list = [c if isinstance(c, str) else str(c) for c in citations_raw] if isinstance(citations_raw, list) else []
            return TargetResponse(
                raw_response=data.get("output", ""),
                latency_ms=elapsed_ms,
                status_code=200,
                retrieved_context=ctx_str,
                citations=citations_list,
                metadata=data.get("telemetry", {}),
            )
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.warning(f"Sandbox daemon communication failed: {e}. Falling back to simulated output.")
            return TargetResponse(
                raw_response=f"Fallback simulated output for {test_case.title}",
                latency_ms=elapsed_ms,
                status_code=200,
                metadata={"sandbox_mode": "fallback_simulated", "connection_error": str(e)},
            )
