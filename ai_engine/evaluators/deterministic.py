"""
QualiTrust AI — Deterministic Evaluators
High-precision evaluation rules for exact matching, JSON schema conformance,
numeric/date validation, citation existence, and structural constraints.
"""

from __future__ import annotations
import re
import json
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from shared.schemas.contracts import (
    TestVerdict,
    SeverityLevel,
    Evidence,
)
from ai_engine.schemas.evaluator import EvaluatorResult

logger = logging.getLogger(__name__)


class DeterministicEvaluator:
    """
    Evaluator performing exact deterministic checks without model hallucination.
    """

    @staticmethod
    def evaluate_exact_match(
        actual_output: str,
        expected_output: str,
        case_sensitive: bool = False,
    ) -> EvaluatorResult:
        act = actual_output if case_sensitive else actual_output.strip().lower()
        exp = expected_output if case_sensitive else expected_output.strip().lower()

        matched = exp in act or act == exp
        verdict = TestVerdict.PASS if matched else TestVerdict.FAIL
        score = 1.0 if matched else 0.0

        return EvaluatorResult(
            evaluator_name="deterministic_exact_match",
            evaluator_version="1.0.0",
            verdict=verdict,
            score=score,
            confidence=1.0,
            severity=SeverityLevel.HIGH if not matched else SeverityLevel.LOW,
            explanation=f"Exact match check: expected string '{expected_output}' {'found' if matched else 'missing'} in response.",
            evidence_data={"expected": expected_output, "actual": actual_output},
        )

    @staticmethod
    def evaluate_numeric_value(
        actual_output: str,
        expected_number: float,
        tolerance: float = 0.01,
    ) -> EvaluatorResult:
        # Extract numeric values from actual text
        numbers = re.findall(r"[-+]?\d*\.\d+|\d+", actual_output)
        found_match = False
        matched_val = None

        for n_str in numbers:
            try:
                val = float(n_str)
                if abs(val - expected_number) <= tolerance:
                    found_match = True
                    matched_val = val
                    break
            except ValueError:
                continue

        verdict = TestVerdict.PASS if found_match else TestVerdict.FAIL
        score = 1.0 if found_match else 0.0

        return EvaluatorResult(
            evaluator_name="deterministic_numeric_comparison",
            evaluator_version="1.0.0",
            verdict=verdict,
            score=score,
            confidence=1.0,
            severity=SeverityLevel.HIGH if not found_match else SeverityLevel.LOW,
            explanation=f"Numeric comparison: expected {expected_number} (+/- {tolerance}), found {matched_val if found_match else 'none matching'}.",
            evidence_data={"expected_number": expected_number, "matched_val": matched_val, "extracted": numbers},
        )

    @staticmethod
    def evaluate_json_schema(
        actual_output: str,
        required_keys: List[str],
    ) -> EvaluatorResult:
        try:
            # Parse json or look for json block
            json_match = re.search(r"\{.*\}", actual_output, re.DOTALL)
            raw_json = json_match.group(0) if json_match else actual_output
            parsed = json.loads(raw_json)

            missing_keys = [k for k in required_keys if k not in parsed]
            if missing_keys:
                return EvaluatorResult(
                    evaluator_name="deterministic_json_schema",
                    evaluator_version="1.0.0",
                    verdict=TestVerdict.FAIL,
                    score=0.0,
                    confidence=1.0,
                    severity=SeverityLevel.HIGH,
                    explanation=f"JSON schema missing required fields: {missing_keys}",
                    evidence_data={"missing_keys": missing_keys, "parsed": parsed},
                )
            return EvaluatorResult(
                evaluator_name="deterministic_json_schema",
                evaluator_version="1.0.0",
                verdict=TestVerdict.PASS,
                score=1.0,
                confidence=1.0,
                severity=SeverityLevel.LOW,
                explanation="All required JSON schema keys are present.",
                evidence_data={"required_keys": required_keys},
            )
        except Exception as e:
            return EvaluatorResult(
                evaluator_name="deterministic_json_schema",
                evaluator_version="1.0.0",
                verdict=TestVerdict.FAIL,
                score=0.0,
                confidence=1.0,
                severity=SeverityLevel.HIGH,
                explanation=f"Response was not valid JSON: {str(e)}",
                evidence_data={"error": str(e)},
            )

    @staticmethod
    def evaluate_citation_existence(
        actual_output: str,
        expected_citation: Optional[str] = None,
    ) -> EvaluatorResult:
        """
        Validates citation syntax e.g. [REF-123], [Doc-1], or specific policy code.
        Note: Citation existence alone does not guarantee grounding.
        """
        citation_matches = re.findall(r"\[([A-Za-z0-9_\-\.\s]+)\]|\(([A-Za-z0-9_\-\.\s]+,\s*\d{4})\)", actual_output)
        found_citations = [m[0] or m[1] for m in citation_matches if m[0] or m[1]]

        if expected_citation:
            matched = any(expected_citation.lower() in c.lower() for c in found_citations) or (expected_citation.lower() in actual_output.lower())
            verdict = TestVerdict.PASS if matched else TestVerdict.FAIL
            score = 1.0 if matched else 0.0
            explanation = f"Expected citation '{expected_citation}' {'found' if matched else 'missing'}."
        else:
            matched = len(found_citations) > 0
            verdict = TestVerdict.PASS if matched else TestVerdict.FAIL
            score = 1.0 if matched else 0.0
            explanation = f"Found {len(found_citations)} citation reference(s) in response."

        return EvaluatorResult(
            evaluator_name="deterministic_citation_existence",
            evaluator_version="1.0.0",
            verdict=verdict,
            score=score,
            confidence=1.0,
            severity=SeverityLevel.MEDIUM if not matched else SeverityLevel.LOW,
            explanation=explanation,
            evidence_data={"citations_found": found_citations},
        )

