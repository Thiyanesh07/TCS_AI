"""
Central Configuration module for QualiTrust AI.
Uses pydantic-settings to validate and provide strongly typed application settings.
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "QualiTrust AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Supabase PostgreSQL Database URL
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="PostgreSQL connection string. E.g., postgresql+psycopg://user:pass@host:5432/postgres",
    )
    DATABASE_CONNECT_TIMEOUT: int = 10
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Authentication & JWT Configuration
    JWT_SECRET_KEY: str = Field(
        default="qualitrust-dev-secret-key-must-be-changed-in-production-32chars",
        description="Cryptographic secret key for signing JWTs",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application Registration & File Limits
    MAX_UPLOAD_SIZE_BYTES: int = 52428800  # 50 MB
    MAX_UNCOMPRESSED_SIZE_BYTES: int = 209715200  # 200 MB
    MAX_ARCHIVE_ENTRIES: int = 2000
    ALLOW_INSECURE_TARGET_URLS: bool = False  # Strict HTTPS / SSRF enforcement
    TEMP_UPLOAD_DIR: str = "temp_uploads"

    # Storage Configuration (Supabase Storage with local dev fallback)
    STORAGE_BACKEND: str = "auto"  # 'auto', 'supabase', or 'local'
    LOCAL_STORAGE_DIR: str = "storage_data"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "application-uploads"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()
