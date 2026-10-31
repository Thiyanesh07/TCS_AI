"""
Evidence model persisting artifacts, logs, metrics, or payloads corroborating findings and test results.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("findings.id", ondelete="CASCADE"), nullable=True, index=True
    )
    test_result_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("test_results.id", ondelete="CASCADE"), nullable=True, index=True
    )
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=False)  # log, metric, payload, artifact_ref
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    payload: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    finding = relationship("Finding", back_populates="evidence")
    test_result = relationship("TestResult", back_populates="evidence")

