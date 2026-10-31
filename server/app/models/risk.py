"""
Risk model representing identified risks in registered applications.
Agreed statuses: 'open', 'mitigated', 'accepted'
Agreed severities: 'critical', 'high', 'medium', 'low'
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class Risk(Base, TimestampMixin):
    __tablename__ = "risks"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # critical, high, medium, low
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False)  # open, mitigated, accepted

    # Relationships
    application = relationship("Application", back_populates="risks")
    findings = relationship("Finding", back_populates="risk")

