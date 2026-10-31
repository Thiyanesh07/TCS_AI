"""
TestResult model representing execution outputs of test cases within an evaluation run.
Agreed verdicts: 'pass', 'fail', 'uncertain', 'error'
Agreed severities: 'critical', 'high', 'medium', 'low'
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID


class TestResult(Base):
    __test__ = False
    __tablename__ = "test_results"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    evaluation_run_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True, index=True
    )
    verdict: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # pass, fail, uncertain, error
    severity: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # critical, high, medium, low
    execution_duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    output_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    evaluation_run = relationship("EvaluationRun", back_populates="test_results")
    test_case = relationship("TestCase", back_populates="test_results")
    evidence = relationship("Evidence", back_populates="test_result")
