"""
Evaluation schemas for QualiTrust AI.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.application import PaginationMetadata


class EvaluationTriggerRequest(BaseModel):
    """Payload to trigger an evaluation run."""
    version_id: Optional[uuid.UUID] = Field(default=None, description="Optional target version ID. Defaults to latest.")


class EvaluationRunResponseData(BaseModel):
    """Evaluation run detail and lifecycle representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    version_id: uuid.UUID
    status: str
    quality_score: Optional[float] = None
    release_status: str
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    uncertain_tests: int = 0
    error_tests: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TestResultResponseData(BaseModel):
    """Test execution output record."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evaluation_run_id: uuid.UUID
    test_case_id: Optional[uuid.UUID] = None
    verdict: str  # pass, fail, uncertain, error
    severity: str  # critical, high, medium, low
    execution_duration_ms: Optional[int] = None
    output_summary: Optional[str] = None
    created_at: datetime


class FindingResponseData(BaseModel):
    """Security or quality defect discovered during evaluation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evaluation_run_id: uuid.UUID
    risk_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    severity: str  # critical, high, medium, low
    status: str  # open, confirmed, disputed, resolved
    created_at: datetime
    updated_at: datetime


class EvidenceResponseData(BaseModel):
    """Evidence artifact supporting findings and test results."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    finding_id: Optional[uuid.UUID] = None
    test_result_id: Optional[uuid.UUID] = None
    evidence_type: str
    file_path: Optional[str] = None
    payload: Optional[Any] = None
    created_at: datetime


class PaginatedEvaluationsData(BaseModel):
    items: List[EvaluationRunResponseData]
    pagination: PaginationMetadata

