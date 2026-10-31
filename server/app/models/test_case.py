"""
TestCase model representing evaluation test suites for applications.
"""

import uuid
from typing import Optional
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class TestCase(Base, TimestampMixin):
    __test__ = False
    __tablename__ = "test_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    is_automated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="test_cases")
    test_results = relationship("TestResult", back_populates="test_case")
