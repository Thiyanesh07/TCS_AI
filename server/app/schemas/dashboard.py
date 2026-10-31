"""
Dashboard summary and activity feed schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DashboardSummaryData(BaseModel):
    """Aggregate statistics for the organisation or platform."""
    total_applications: int
    total_evaluations: int
    total_risks: int
    eligible_releases: int
    blocked_releases: int
    average_quality_score: Optional[float] = None


class DashboardActivityItem(BaseModel):
    """Activity event in the timeline."""
    id: uuid.UUID
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    description: str
    timestamp: datetime


class DashboardActivityData(BaseModel):
    items: List[DashboardActivityItem]
    total: int

