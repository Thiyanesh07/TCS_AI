"""
QualiTrust AI — LangGraph Stateful Evaluation Workflow State
Defines the complete state carried across all 15 stages.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from shared.schemas.contracts import (
    AIEngineInput,
    AIEngineOutput,
    Risk,
    TestCase,
    TestResult,
    Evidence,
    Finding,
    RegressionRecommendation,
    DimensionScore,
    RunStatus,
    ReleaseStatus,
)
from ai_engine.schemas.profile import ApplicationProfile


class AIEvaluationState(BaseModel):
    # Inputs
    input_data: AIEngineInput

    # Stage 1: Application Analysis
    application_profile: Optional[ApplicationProfile] = None
    is_supported_app: bool = True
    connectivity_verified: bool = True

    # Stage 2 & 3: Risk Analysis & Validation
    risks: List[Risk] = Field(default_factory=list)
    critical_risks_identified: bool = False

    # Stage 4, 5, 6: Test Generation, Validation, Prioritisation
    generated_tests: List[TestCase] = Field(default_factory=list)
    prioritized_tests: List[TestCase] = Field(default_factory=list)

    # Stage 7: Test Execution
    raw_responses: Dict[str, Any] = Field(default_factory=dict)
    execution_latencies: Dict[str, float] = Field(default_factory=dict)
    execution_errors: List[str] = Field(default_factory=list)

    # Stage 8, 9, 10: Multi-dimensional Evaluators
    test_results: List[TestResult] = Field(default_factory=list)
    evidence_collected: List[Evidence] = Field(default_factory=list)

    # Stage 11: Failure Classification & Diagnosis
    findings: List[Finding] = Field(default_factory=list)
    critical_failures_found: bool = False

    # Stage 12: Evidence Aggregation
    evidence_by_result_id: Dict[str, List[Evidence]] = Field(default_factory=dict)

    # Stage 13: Score Preparation
    metric_results: Dict[str, DimensionScore] = Field(default_factory=dict)
    overall_quality_score: Optional[float] = None
    release_recommendation: ReleaseStatus = ReleaseStatus.PENDING

    # Stage 14: Regression Generation
    regression_recommendations: List[RegressionRecommendation] = Field(default_factory=list)

    # Stage 15: Result Assembly
    final_output: Optional[AIEngineOutput] = None
    workflow_status: RunStatus = RunStatus.RUNNING
    error_message: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
