"""
Application model representing AI-enabled applications registered by organisations.
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    integration_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'zip' or 'api'
    status: Mapped[str] = mapped_column(String(50), default="registered", nullable=False)

    # Relationships
    organisation = relationship("Organisation", back_populates="applications")
    versions = relationship("ApplicationVersion", back_populates="application", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="application", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="application", cascade="all, delete-orphan")
    evaluation_runs = relationship("EvaluationRun", back_populates="application", cascade="all, delete-orphan")
    regression_tests = relationship("RegressionTest", back_populates="application", cascade="all, delete-orphan")

