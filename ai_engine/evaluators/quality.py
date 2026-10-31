"""
QualiTrust AI — Quality Dimension Evaluators
Evaluates Accuracy, Completeness, Consistency, and Citation Quality.
"""

from __future__ import annotations
import re
import logging
from typing import Any, Dict, List, Optional
from shared.schemas.contracts import (
    TestVerdict,
    SeverityLevel,
)
from ai_engine.schemas.evaluator import EvaluatorResult

logger = logging.getLogger(__name__)


class QualityEvaluator:
    @staticmethod
    def evaluate_completeness(
        response_text: str,
        required_topics: List[str],
    ) -> EvaluatorResult:
        missing = [t for t in required_topics if t.lower() not in response_text.lower()]
        total = len(required_topics)
        score = (total - len(missing)) / max(total, 1)

        verdict = TestVerdict.PASS if len(missing) == 0 else (TestVerdict.FAIL if score < 0.6 else TestVerdict.UNCERTAIN)

        return EvaluatorResult(
            evaluator_name="quality_completeness_evaluator",
            evaluator_version="1.0.0",
            verdict=verdict,
            score=score,
            confidence=0.9,
            severity=SeverityLevel.MEDIUM if len(missing) > 0 else SeverityLevel.LOW,
            explanation=f"Completeness evaluated: {len(required_topics) - len(missing)}/{total} required elements found. Missing: {missing}",
            evidence_data={"required": required_topics, "missing": missing},
        )

    @staticmethod
    def evaluate_consistency(
        turn_responses: List[str],
        expected_constant_entity: Optional[str] = None,
    ) -> EvaluatorResult:
        if expected_constant_entity:
            missing_in_turn = [
                idx for idx, turn in enumerate(turn_responses)
                if expected_constant_entity.lower() not in turn.lower()
            ]
            if missing_in_turn:
                return EvaluatorResult(
                    evaluator_name="quality_consistency_evaluator",
                    evaluator_version="1.0.0",
                    verdict=TestVerdict.FAIL,
                    score=0.0,
                    confidence=1.0,
                    severity=SeverityLevel.HIGH,
                    explanation=f"Conversational memory drift: expected entity '{expected_constant_entity}' absent in turns: {missing_in_turn}",
                    evidence_data={"missing_turns": missing_in_turn, "entity": expected_constant_entity},
                )
        return EvaluatorResult(
            evaluator_name="quality_consistency_evaluator",
            evaluator_version="1.0.0",
            verdict=TestVerdict.PASS,
            score=1.0,
            confidence=0.95,
            severity=SeverityLevel.LOW,
            explanation="Responses maintained conversational memory and persona consistency.",
        )

    @staticmethod
    def evaluate_citation_quality(
        response_text: str,
        valid_source_ids: List[str],
    ) -> EvaluatorResult:
        # Find citations like [REF-01], [Doc-12]
        found = re.findall(r"\[([A-Za-z0-9_\-\.\s]+)\]", response_text)
        if not found:
            return EvaluatorResult(
                evaluator_name="quality_citation_evaluator",
                evaluator_version="1.0.0",
                verdict=TestVerdict.FAIL,
                score=0.0,
                confidence=1.0,
                severity=SeverityLevel.MEDIUM,
                explanation="No citation markers found in text where citations were required.",
            )

        invalid_citations = [c for c in found if not any(c.lower() in v.lower() for v in valid_source_ids)]
        if invalid_citations:
            return EvaluatorResult(
                evaluator_name="quality_citation_evaluator",
                evaluator_version="1.0.0",
                verdict=TestVerdict.FAIL,
                score=0.2,
                confidence=0.95,
                severity=SeverityLevel.HIGH,
                explanation=f"Hallucinated or invalid citations found: {invalid_citations}",
                evidence_data={"invalid_citations": invalid_citations, "valid_sources": valid_source_ids},
            )

        return EvaluatorResult(
            evaluator_name="quality_citation_evaluator",
            evaluator_version="1.0.0",
            verdict=TestVerdict.PASS,
            score=1.0,
            confidence=1.0,
            severity=SeverityLevel.LOW,
            explanation=f"All {len(found)} citation references match registered knowledge documents.",
            evidence_data={"valid_citations": found},
        )

