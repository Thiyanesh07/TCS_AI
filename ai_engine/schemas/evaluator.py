"""
QualiTrust AI — AI Engine Evaluator & Grounding Schemas
Structures for deterministic and model-assisted evaluation results.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from enum import Enum
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from shared.schemas.contracts import TestVerdict, SeverityLevel


class ClaimType(str, Enum):
    NUMERIC = "numeric"
    TEMPORAL = "temporal"
    ENTITY_IDENTIFIER = "entity_identifier"
    FACTUAL_RELATION = "factual_relation"
    POLICY_CITATION = "policy_citation"
    GENERAL_SEMANTIC = "general_semantic"


class ClaimVerdict(str, Enum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNSUPPORTED = "unsupported"
    UNVERIFIABLE = "unverifiable"


class ExtractedClaim(BaseModel):
    claim_id: UUID = Field(default_factory=uuid4)
    claim_text: str
    claim_type: ClaimType
    verdict: ClaimVerdict = ClaimVerdict.UNVERIFIABLE
    evidence_reference: Optional[str] = None
    source_version: Optional[str] = None
    confidence: float = 1.0
    explanation: str = ""
    is_exact_match: bool = False


class GroundingReport(BaseModel):
    total_claims: int = 0
    supported_claims: int = 0
    contradicted_claims: int = 0
    unsupported_claims: int = 0
    unverifiable_claims: int = 0
    grounding_score: float = 0.0
    claims: List[ExtractedClaim] = Field(default_factory=list)
    citations_valid: bool = True
    unobservable_context: bool = False


class EvaluatorResult(BaseModel):
    evaluator_name: str
    evaluator_version: str = "1.0.0"
    verdict: TestVerdict
    score: Optional[float] = None
    confidence: Optional[float] = None
    severity: SeverityLevel = SeverityLevel.MEDIUM
    explanation: str
    evidence_data: Dict[str, Any] = Field(default_factory=dict)
    grounding_report: Optional[GroundingReport] = None

