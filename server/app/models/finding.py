"""
Finding model capturing specific security, reliability, or quality issues discovered during evaluations.
Agreed statuses: 'open', 'confirmed', 'disputed', 'resolved'
Agreed severities: 'critical', 'high', 'medium', 'low'
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class Finding(Base, TimestampMixin):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    evaluation_run_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    risk_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("risks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # critical, high, medium, low
    status: Mapped[str] = mapped_column(
        String(50), default="open", nullable=False, index=True
    )  # open, confirmed, disputed, resolved

    # Relationships
    evaluation_run = relationship("EvaluationRun", back_populates="findings")
    risk = relationship("Risk", back_populates="findings")
    evidence = relationship("Evidence", back_populates="finding")

