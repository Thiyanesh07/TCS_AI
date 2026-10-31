"""
EvaluationRun model tracking the lifecycle and results of AI application evaluations.
Agreed evaluation statuses: 'queued', 'running', 'completed', 'failed', 'cancelled'
Agreed release statuses: 'eligible', 'blocked', 'review_required', 'inconclusive', 'pending'
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class EvaluationRun(Base, TimestampMixin):
    __tablename__ = "evaluation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("application_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="queued", nullable=False, index=True
    )  # queued, running, completed, failed, cancelled
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    release_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False, index=True
    )  # eligible, blocked, review_required, inconclusive, pending

    # Test counts
    total_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    passed_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uncertain_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    application = relationship("Application", back_populates="evaluation_runs")
    version = relationship("ApplicationVersion", back_populates="evaluation_runs")
    test_results = relationship("TestResult", back_populates="evaluation_run", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="evaluation_run", cascade="all, delete-orphan")
    release_review = relationship("ReleaseReview", back_populates="evaluation_run", uselist=False, cascade="all, delete-orphan")

