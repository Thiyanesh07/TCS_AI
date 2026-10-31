"""
ReleaseReview model for sign-off decisions and audit trails regarding release readiness.
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class ReleaseReview(Base, TimestampMixin):
    __tablename__ = "release_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    evaluation_run_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    reviewer_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # approved, rejected, conditionally_approved
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    evaluation_run = relationship("EvaluationRun", back_populates="release_review")
    reviewer = relationship("User")

