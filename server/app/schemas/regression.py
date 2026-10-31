"""
Regression testing schemas for QualiTrust AI.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RegressionTestCreateRequest(BaseModel):
    """Payload to create a regression test suite."""
    name: str = Field(min_length=1, max_length=255, description="Regression suite name")
    baseline_run_id: Optional[uuid.UUID] = Field(default=None, description="Optional baseline evaluation run ID")
    target_version_id: Optional[uuid.UUID] = Field(default=None, description="Optional target version ID")


class RegressionTestResponseData(BaseModel):
    """Regression test suite representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    name: str
    baseline_run_id: Optional[uuid.UUID] = None
    target_version_id: Optional[uuid.UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime


class RegressionExecutionResponseData(BaseModel):
    """Execution output comparing target version against baseline run."""
    regression_test_id: uuid.UUID
    name: str
    evaluation_run_id: uuid.UUID
    status: str
    current_quality_score: Optional[float] = None
    baseline_quality_score: Optional[float] = None
    regression_detected: bool
    release_status: str

