"""
Storage service for QualiTrust AI.
Manages application bundle artifacts behind a unified storage interface, supporting
Supabase Storage (with service-role authentication) and a secure local development provider.
"""

import os
import uuid
from abc import ABC, abstractmethod
from typing import Optional
import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class BaseStorageService(ABC):
    """Abstract storage interface for object persistence."""

    @abstractmethod
    def upload_file(self, key: str, data: bytes, content_type: str = "application/zip") -> str:
        """Uploads binary content under the specified object key."""
        pass

    @abstractmethod
    def download_file(self, key: str) -> bytes:
        """Downloads binary content for the given object key."""
        pass

    @abstractmethod
    def delete_file(self, key: str) -> bool:
        """Deletes an object by key."""
        pass

    @abstractmethod
    def file_exists(self, key: str) -> bool:
        """Checks if an object exists."""
        pass


class LocalStorageService(BaseStorageService):
    """Secure local filesystem storage provider for offline development and testing."""

    def __init__(self, base_dir: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def _resolve_safe_path(self, key: str) -> str:
        # Prevent directory traversal in keys
        clean_key = os.path.normpath(key).lstrip(r"\/")
        full_path = os.path.abspath(os.path.join(self.base_dir, clean_key))
        if not full_path.startswith(self.base_dir):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage key path.",
            )
        return full_path

    def upload_file(self, key: str, data: bytes, content_type: str = "application/zip") -> str:
        target_path = self._resolve_safe_path(key)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(data)
        return key

    def download_file(self, key: str) -> bytes:
        target_path = self._resolve_safe_path(key)
        if not os.path.exists(target_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stored archive object not found.",
            )
        with open(target_path, "rb") as f:
            return f.read()

    def delete_file(self, key: str) -> bool:
        target_path = self._resolve_safe_path(key)
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
                return True
            except OSError:
                return False
        return False

    def file_exists(self, key: str) -> bool:
        target_path = self._resolve_safe_path(key)
        return os.path.exists(target_path)


class SupabaseStorageService(BaseStorageService):
    """
    Supabase Storage API client provider.
    Uses backend service-role credentials; secrets are never leaked to the client.
    """

    def __init__(
        self,
        supabase_url: str,
        service_role_key: str,
        bucket_name: str = settings.SUPABASE_STORAGE_BUCKET,
    ):
        self.supabase_url = supabase_url.rstrip("/")
        self.service_role_key = service_role_key
        self.bucket_name = bucket_name
        self.headers = {
            "Authorization": f"Bearer {self.service_role_key}",
            "apikey": self.service_role_key,
        }

    def upload_file(self, key: str, data: bytes, content_type: str = "application/zip") -> str:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{key}"
        headers = {**self.headers, "Content-Type": content_type, "x-upsert": "true"}
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, headers=headers, content=data)
            if res.status_code in (200, 201):
                return key
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to upload archive to Supabase Storage.",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Storage service unavailable.",
            )

    def download_file(self, key: str) -> bytes:
        url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket_name}/{key}"
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.get(url, headers=self.headers)
            if res.status_code == 200:
                return res.content
            if res.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Stored archive object not found in storage bucket.",
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to retrieve archive from Supabase Storage.",
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Storage service unavailable.",
            )

    def delete_file(self, key: str) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{key}"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.delete(url, headers=self.headers)
            return res.status_code in (200, 204)
        except httpx.RequestError:
            return False

    def file_exists(self, key: str) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/info/authenticated/{self.bucket_name}/{key}"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, headers=self.headers)
            return res.status_code == 200
        except httpx.RequestError:
            return False


def generate_application_storage_key(
    organisation_id: uuid.UUID,
    application_id: uuid.UUID,
    version_id: uuid.UUID,
) -> str:
    """
    Generates an unpredictable, tenant-isolated object storage path.
    Never uses user-supplied filenames.
    Format: org_{org_id}/apps/{app_id}/{version_id}_{random_hex}.zip
    """
    random_token = uuid.uuid4().hex[:12]
    return f"org_{organisation_id}/apps/{application_id}/{version_id}_{random_token}.zip"


def get_storage_service() -> BaseStorageService:
    """
    Factory resolving the appropriate storage service provider.
    Uses Supabase Storage if configured; falls back safely to LocalStorageService.
    """
    has_valid_supabase = bool(
        settings.SUPABASE_URL
        and "[YOUR-PROJECT-REF]" not in settings.SUPABASE_URL
        and "<" not in settings.SUPABASE_URL
        and settings.SUPABASE_SERVICE_ROLE_KEY
        and "placeholder" not in settings.SUPABASE_SERVICE_ROLE_KEY
        and "your-service-role-key" not in settings.SUPABASE_SERVICE_ROLE_KEY
    )
    use_supabase = (
        settings.STORAGE_BACKEND == "supabase"
        or (settings.STORAGE_BACKEND == "auto" and has_valid_supabase)
    )

    if use_supabase and settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        return SupabaseStorageService(
            supabase_url=settings.SUPABASE_URL,
            service_role_key=settings.SUPABASE_SERVICE_ROLE_KEY,
            bucket_name=settings.SUPABASE_STORAGE_BUCKET,
        )

    return LocalStorageService(base_dir=settings.LOCAL_STORAGE_DIR)

