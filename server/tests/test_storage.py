"""
Automated tests for Application Storage Service.
Tests object persistence, path traversal defense, and key generation.
"""

import uuid
import pytest
from fastapi import HTTPException
from app.services.storage_service import (
    LocalStorageService,
    generate_application_storage_key,
    get_storage_service,
)


def test_local_storage_lifecycle(tmp_path):
    """Verifies upload, existence, download, and deletion lifecycle in local storage."""
    storage = LocalStorageService(base_dir=str(tmp_path))
    key = "org_123/apps/456/test_bundle.zip"
    data = b"PK\x03\x04test_content_bytes"

    # 1. Upload
    res_key = storage.upload_file(key, data)
    assert res_key == key
    assert storage.file_exists(key) is True

    # 2. Download
    downloaded = storage.download_file(key)
    assert downloaded == data

    # 3. Delete
    deleted = storage.delete_file(key)
    assert deleted is True
    assert storage.file_exists(key) is False


def test_storage_path_traversal_rejection(tmp_path):
    """Storage keys with path traversal attempts are rejected."""
    storage = LocalStorageService(base_dir=str(tmp_path))
    dangerous_key = "../../../etc/passwd"

    with pytest.raises(HTTPException) as exc_info:
        storage.upload_file(dangerous_key, b"malicious")
    assert exc_info.value.status_code == 400


def test_generate_application_storage_key():
    """Generates tenant-isolated, unpredictable storage object keys."""
    org_id = uuid.uuid4()
    app_id = uuid.uuid4()
    ver_id = uuid.uuid4()

    key1 = generate_application_storage_key(org_id, app_id, ver_id)
    key2 = generate_application_storage_key(org_id, app_id, ver_id)

    assert key1.startswith(f"org_{org_id}/apps/{app_id}/{ver_id}_")
    assert key1.endswith(".zip")
    assert key1 != key2  # Unpredictable random suffix

