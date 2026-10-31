"""
RegressionTest model managing regression suites across versions.
"""

import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class RegressionTest(Base, TimestampMixin):
    __tablename__ = "regression_tests"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    baseline_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("evaluation_runs.id", ondelete="SET NULL"), nullable=True
    )
    target_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("application_versions.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    # Relationships
    application = relationship("Application", back_populates="regression_tests")

