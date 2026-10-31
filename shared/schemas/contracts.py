"""
QualiTrust AI — Shared Canonical Data Contracts & Schemas
Agreed data models for Backend, Frontend, and AI Engine.
Defined as per Master Prompt Section 7 & 8 and AI Engineer Prompt Section 16.
"""

from __future__ import annotations
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class IntegrationType(str, Enum):
    ZIP = "zip"
    API = "api"


class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ReleaseStatus(str, Enum):
    ELIGIBLE = "eligible"
    BLOCKED = "blocked"
    REVIEW_REQUIRED = "review_required"
    INCONCLUSIVE = "inconclusive"
    PENDING = "pending"


class TestVerdict(str, Enum):
    __test__ = False
    PASS = "pass"
    FAIL = "fail"
    UNCERTAIN = "uncertain"
    ERROR = "error"


class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FindingStatus(str, Enum):
    OPEN = "open"
    CONFIRMED = "confirmed"
    DISPUTED = "disputed"
    RESOLVED = "resolved"


class RiskStatus(str, Enum):
    OPEN = "open"
    MITIGATED = "mitigated"
    ACCEPTED = "accepted"


class RiskCategory(str, Enum):
    ACCURACY = "Accuracy"
    GROUNDING = "Grounding"
    COMPLETENESS = "Completeness"
    CONSISTENCY = "Consistency"
    SAFETY = "Safety"
    PROMPT_INJECTION = "Prompt injection"
    PRIVACY = "Privacy"
    TOOL_SECURITY = "Tool security"
    RELIABILITY = "Reliability"
    PERFORMANCE = "Performance"
    CUSTOM = "Custom"


class TestCategory(str, Enum):
    __test__ = False
    FUNCTIONAL = "functional"
    ACCURACY = "accuracy"
    GROUNDING = "grounding"
    SAFETY = "safety"
    SECURITY = "security"
    PROMPT_INJECTION = "prompt_injection"
    PRIVACY = "privacy"
    CONSISTENCY = "consistency"
    BOUNDARY = "boundary"
    MULTI_TURN = "multi_turn"
    TOOL_USE = "tool_use"
    REGRESSION = "regression"


# ---------------------------------------------------------------------------
# Core Entities (Master Prompt Section 8)
# ---------------------------------------------------------------------------

class BaseEntity(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class Application(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    organisation_id: UUID
    name: str
    description: str = ""
    integration_type: IntegrationType
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationVersion(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    application_id: UUID
    version_label: str
    source_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EvaluationRun(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    application_id: UUID
    version_id: UUID
    status: RunStatus = RunStatus.QUEUED
    quality_score: Optional[float] = None
    release_status: ReleaseStatus = ReleaseStatus.PENDING
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    uncertain_tests: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class Risk(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    application_id: UUID
    category: str
    description: str
    likelihood: int = Field(ge=1, le=5, description="Likelihood from 1 to 5")
    impact: int = Field(ge=1, le=5, description="Impact from 1 to 5")
    priority_score: float = Field(description="Deterministic score = likelihood * impact")
    status: RiskStatus = RiskStatus.OPEN
    component_target: Optional[str] = None
    justification: Optional[str] = None


class TestCase(BaseEntity):
    __test__ = False
    id: UUID = Field(default_factory=uuid4)
    risk_id: Optional[UUID] = None
    title: str
    category: TestCategory
    priority: SeverityLevel = SeverityLevel.MEDIUM
    input: Union[str, Dict[str, Any], List[Dict[str, Any]]]
    expected_behaviour: str
    evaluation_method: str
    evidence_requirements: List[str] = Field(default_factory=list)
    execution_constraints: Dict[str, Any] = Field(default_factory=dict)
    generation_reason: str = ""


class TestResult(BaseEntity):
    __test__ = False
    id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    test_case_id: UUID
    verdict: TestVerdict
    severity: SeverityLevel
    response: Union[str, Dict[str, Any]]
    evaluator_name: str
    confidence: Optional[float] = None
    latency_ms: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Evidence(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    test_result_id: UUID
    evidence_type: str
    source_reference: Optional[str] = None
    source_version: Optional[str] = None
    content_hash: Optional[str] = None
    content_excerpt: Optional[str] = None
    evaluator_method: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Finding(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    application_id: UUID
    risk_category: str
    title: str
    description: str
    severity: SeverityLevel
    status: FindingStatus = FindingStatus.OPEN
    evidence_ids: List[UUID] = Field(default_factory=list)
    root_cause_hypothesis: Optional[str] = None
    remediation_recommendation: Optional[str] = None
    confidence: Optional[float] = None


class RegressionRecommendation(BaseEntity):
    id: UUID = Field(default_factory=uuid4)
    application_id: UUID
    original_failure_id: Optional[UUID] = None
    test_case_id: Optional[UUID] = None
    title: str
    category: TestCategory
    input: Union[str, Dict[str, Any], List[Dict[str, Any]]]
    expected_behaviour: str
    associated_risk_id: Optional[UUID] = None
    version_created: str = "v1.0.0"
    reason: str = ""
    validation_status: str = "pending_review"  # pending_review | approved | active


# ---------------------------------------------------------------------------
# AI Engine Stable Python Interface Contracts (AI Prompt Section 16)
# ---------------------------------------------------------------------------

class TestBudget(BaseEntity):
    __test__ = False
    baseline: int = 10
    risk_targeted: int = 10
    adversarial: int = 5
    regression: int = 5


class AIEngineInput(BaseEntity):
    run_id: UUID
    application_id: UUID
    version_id: UUID
    integration_type: IntegrationType
    application_config: Dict[str, Any] = Field(default_factory=dict)
    discovery_report: Optional[Dict[str, Any]] = None
    risk_config: Optional[Dict[str, Any]] = None
    evaluation_config: Optional[Dict[str, Any]] = None
    test_budget: TestBudget = Field(default_factory=TestBudget)


class DimensionScore(BaseEntity):
    dimension: str
    score: float = Field(ge=0.0, le=1.0)
    sample_size: int = 0
    passed_count: int = 0
    failed_count: int = 0
    uncertain_count: int = 0
    unscorable_count: int = 0
    evaluator_versions: List[str] = Field(default_factory=list)


class AIEngineOutput(BaseEntity):
    run_id: UUID
    application_id: UUID
    version_id: UUID
    status: RunStatus
    application_profile: Dict[str, Any]
    risks: List[Risk] = Field(default_factory=list)
    test_cases: List[TestCase] = Field(default_factory=list)
    test_results: List[TestResult] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    metric_results: Dict[str, DimensionScore] = Field(default_factory=dict)
    overall_quality_score: Optional[float] = None
    release_recommendation: ReleaseStatus = ReleaseStatus.PENDING
    regression_recommendations: List[RegressionRecommendation] = Field(default_factory=list)
    trace_metadata: Dict[str, Any] = Field(default_factory=dict)
    execution_notes: List[str] = Field(default_factory=list)
