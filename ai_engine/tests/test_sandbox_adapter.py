"""
QualiTrust AI — Sandbox & Archive Security Tests
Tests ZipSlip directory traversal prevention, compression quotas, binary blocklists,
and isolated sandbox execution fallback.
"""

import os
import zipfile
import tempfile
import pytest

from shared.schemas.contracts import TestCase, TestCategory
from ai_engine.adapters.sandbox_adapter import (
    SafeArchiveInspector,
    ArchiveSecurityError,
    SandboxTargetAdapter,
)


def test_safe_archive_inspector_clean_archive():
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "valid_app.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("app/main.py", "print('Hello from safe app')")
            zf.writestr("app/requirements.txt", "fastapi\nuvicorn\n")
            zf.writestr("README.md", "# Test App")

        report = SafeArchiveInspector.inspect_archive(zip_path)
        assert report["valid"] is True
        assert report["file_count"] == 3
        assert report["has_blocked_binaries"] is False

        # Safe extraction
        extract_dir = os.path.join(tmpdir, "extracted")
        SafeArchiveInspector.safe_extract(zip_path, extract_dir)
        assert os.path.exists(os.path.join(extract_dir, "app", "main.py"))


def test_safe_archive_inspector_zipslip_rejection():
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "malicious_zipslip.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            # Dangerous path traversal entry
            zf.writestr("../../evil.sh", "echo 'PWNED'")

        with pytest.raises(ArchiveSecurityError) as exc_info:
            SafeArchiveInspector.inspect_archive(zip_path)
        assert "Directory traversal detected" in str(exc_info.value)


def test_safe_archive_inspector_blocked_binary():
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "archive_with_binary.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("bin/payload.exe", b"\x4d\x5a\x90\x00")  # Windows PE header

        report = SafeArchiveInspector.inspect_archive(zip_path)
        assert report["has_blocked_binaries"] is True
        assert "bin/payload.exe" in report["suspicious_files"]


def test_sandbox_target_adapter_fallback_mode():
    adapter = SandboxTargetAdapter()
    tc = TestCase(
        title="Isolated Calculation Test",
        category=TestCategory.FUNCTIONAL,
        input="compute isolated matrix",
        expected_behaviour="Executed safely",
        evaluation_method="exact_match",
    )
    resp = adapter.execute(tc)
    assert resp.status_code == 200
    assert "Controlled simulated sandbox" in resp.raw_response or "Fallback" in resp.raw_response
    assert "sandbox_mode" in resp.metadata

