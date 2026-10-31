"""
QualiTrust AI — Claim-Level Grounding Evaluation Pipeline
Implements the 8-stage grounding verification architecture:
Claim extraction -> Claim typing -> Evidence matching -> Version validation ->
Deterministic fact check -> Semantic assessment -> Verdict generation -> Forensic evidence storage.
"""

from __future__ import annotations
import re
import hashlib
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from shared.schemas.contracts import (
    TestVerdict,
    SeverityLevel,
    Evidence,
)
from ai_engine.schemas.evaluator import (
    ClaimType,
    ClaimVerdict,
    ExtractedClaim,
    GroundingReport,
    EvaluatorResult,
)
from ai_engine.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class GroundingEvaluator:
    """
    Evaluator performing claim-level grounding verification against approved documents.
    Verdicts: supported, contradicted, unsupported, unverifiable.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider

    def evaluate_grounding(
        self,
        response_text: str,
        reference_documents: Dict[str, str],
        active_document_versions: Optional[Dict[str, str]] = None,
        retrieved_context: Optional[str] = None,
    ) -> EvaluatorResult:
        """
        Runs the complete claim-level evaluation pipeline.
        """
        active_versions = active_document_versions or {}
        claims: List[ExtractedClaim] = []

        # If no documents are available at all, mark as unverifiable / unobservable
        if not reference_documents and not retrieved_context:
            return EvaluatorResult(
                evaluator_name="claim_level_grounding_evaluator",
                evaluator_version="1.0.0",
                verdict=TestVerdict.UNCERTAIN,
                score=0.5,
                confidence=0.7,
                severity=SeverityLevel.MEDIUM,
                explanation="Unobservable context: No reference documents or retrieved context available to verify claims.",
                grounding_report=GroundingReport(
                    unobservable_context=True,
                    unverifiable_claims=1,
                    grounding_score=0.5,
                ),
            )

        # Combine reference documents and context
        combined_sources = dict(reference_documents)
        if retrieved_context:
            combined_sources["_retrieved_context"] = retrieved_context

        # Stage 1 & 2: Extract factual claims and assign claim types
        extracted_raw_claims = self._extract_claims(response_text)

        supported_count = 0
        contradicted_count = 0
        unsupported_count = 0
        unverifiable_count = 0

        for claim_text in extracted_raw_claims:
            c_type = self._classify_claim_type(claim_text)
            verdict, ref_doc, src_ver, is_exact, explanation = self._verify_single_claim(
                claim_text, c_type, combined_sources, active_versions
            )

            claim_obj = ExtractedClaim(
                claim_text=claim_text,
                claim_type=c_type,
                verdict=verdict,
                evidence_reference=ref_doc,
                source_version=src_ver,
                confidence=1.0 if is_exact else 0.85,
                explanation=explanation,
                is_exact_match=is_exact,
            )
            claims.append(claim_obj)

            if verdict == ClaimVerdict.SUPPORTED:
                supported_count += 1
            elif verdict == ClaimVerdict.CONTRADICTED:
                contradicted_count += 1
            elif verdict == ClaimVerdict.UNSUPPORTED:
                unsupported_count += 1
            elif verdict == ClaimVerdict.UNVERIFIABLE:
                unverifiable_count += 1

        total_claims = len(claims)
        if total_claims == 0:
            score = 1.0
            overall_verdict = TestVerdict.PASS
        elif contradicted_count > 0:
            score = max(0.0, 1.0 - (contradicted_count * 0.5) - (unsupported_count * 0.2))
            overall_verdict = TestVerdict.FAIL
        elif unsupported_count > 0:
            score = max(0.0, (supported_count / total_claims))
            overall_verdict = TestVerdict.FAIL
        elif unverifiable_count > 0:
            score = 0.5
            overall_verdict = TestVerdict.UNCERTAIN
        else:
            score = supported_count / total_claims
            overall_verdict = TestVerdict.PASS if score >= 0.8 else TestVerdict.FAIL

        grounding_report = GroundingReport(
            total_claims=total_claims,
            supported_claims=supported_count,
            contradicted_claims=contradicted_count,
            unsupported_claims=unsupported_count,
            unverifiable_claims=unverifiable_count,
            grounding_score=score,
            claims=claims,
            unobservable_context=False,
        )

        return EvaluatorResult(
            evaluator_name="claim_level_grounding_evaluator",
            evaluator_version="1.0.0",
            verdict=overall_verdict,
            score=score,
            confidence=0.92,
            severity=SeverityLevel.HIGH if contradicted_count > 0 else SeverityLevel.MEDIUM,
            explanation=(
                f"Grounding verification complete. Claims: {total_claims} "
                f"(Supported: {supported_count}, Contradicted: {contradicted_count}, "
                f"Unsupported: {unsupported_count}, Unverifiable: {unverifiable_count}). "
                f"Grounding score: {score:.2f}."
            ),
            evidence_data={"claims": [c.model_dump(mode="json") for c in claims]},
            grounding_report=grounding_report,
        )

    def _extract_claims(self, text: str) -> List[str]:
        """Splits output into discrete factual sentence units."""
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        claims = [s.strip() for s in sentences if len(s.strip()) > 8]
        return claims if claims else [text.strip()]

    def _classify_claim_type(self, claim: str) -> ClaimType:
        """Categorizes claim according to deterministic syntax rules."""
        if re.search(r"\$\d+|\d+%\s*|\b\d+(\.\d+)?\s*(dollars|usd|units|years|months)\b", claim, re.I):
            return ClaimType.NUMERIC
        if re.search(r"\b(19\d\d|20\d\d)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b", claim, re.I):
            return ClaimType.TEMPORAL
        if re.search(r"\b(REF-\d+|POL-\d+|DOC-\d+|ACC-\d+|[A-Z]{3}-\d{4,})\b", claim):
            return ClaimType.POLICY_CITATION
        if re.search(r"\b(ID:[A-Za-z0-9\-]+|account\s+id)\b", claim, re.I):
            return ClaimType.ENTITY_IDENTIFIER
        return ClaimType.GENERAL_SEMANTIC

    def _verify_single_claim(
        self,
        claim: str,
        claim_type: ClaimType,
        sources: Dict[str, str],
        active_versions: Dict[str, str],
    ) -> tuple[ClaimVerdict, Optional[str], Optional[str], bool, str]:
        """
        Validates claim against sources using deterministic checks for numbers/dates/IDs,
        and semantic checks for general claims.
        """
        claim_lower = claim.lower()

        # Check for citation/policy tag in claim
        citation_match = re.search(r"\b(REF-\d+|POL-\d+|DOC-\d+)\b", claim)
        target_ref = citation_match.group(1) if citation_match else None

        # Search matching document
        matched_doc_name = None
        matched_doc_content = None

        if target_ref:
            for doc_name, content in sources.items():
                if target_ref.lower() in doc_name.lower() or target_ref.lower() in content.lower():
                    matched_doc_name = doc_name
                    matched_doc_content = content
                    break

        if not matched_doc_content:
            # Fallback to search all sources
            for doc_name, content in sources.items():
                claim_words = [w for w in re.findall(r"\w+", claim_lower) if len(w) > 3]
                content_words = [cw.lower() for cw in re.findall(r"\w+", content) if len(cw) > 3]
                matches = sum(1 for w in claim_words if any(w[:4] in cw or cw[:4] in w for cw in content_words))
                if matches >= 2:
                    matched_doc_name = doc_name
                    matched_doc_content = content
                    break

        if not matched_doc_content:
            return ClaimVerdict.UNSUPPORTED, None, None, False, "Claim is unsupported: no relevant reference document corroborates this statement."

        doc_lower = matched_doc_content.lower()

        # Check version staleness
        doc_version = active_versions.get(matched_doc_name, "current")
        if "stale" in doc_version.lower() or "superseded" in doc_version.lower():
            return ClaimVerdict.CONTRADICTED, matched_doc_name, doc_version, False, f"Claim references superseded/stale document version '{doc_version}'."

        # Stage 5: Exact facts comparison (Dates, Amounts, IDs)
        if claim_type in (ClaimType.NUMERIC, ClaimType.TEMPORAL, ClaimType.POLICY_CITATION, ClaimType.ENTITY_IDENTIFIER):
            # Extract key tokens
            key_tokens = re.findall(r"\b[A-Za-z0-9\-\.\$%/]+\b", claim)
            critical_tokens = [
                t for t in key_tokens
                if any(c.isdigit() for c in t) or "-" in t or "$" in t or "%" in t
            ]

            if critical_tokens:
                missing_tokens = [t for t in critical_tokens if t.lower() not in doc_lower]
                if not missing_tokens:
                    return ClaimVerdict.SUPPORTED, matched_doc_name, doc_version, True, f"Exact match for critical fact tokens: {critical_tokens}"
                else:
                    return ClaimVerdict.CONTRADICTED, matched_doc_name, doc_version, False, f"Contradiction: Source document does not corroborate key values {missing_tokens}."

        # Stage 6: Semantic assessment
        # Check if negations or contradictory terms exist
        if "never" in claim_lower and any(req in doc_lower for req in ["always", "requires", "must", "mandatory"]):
            return ClaimVerdict.CONTRADICTED, matched_doc_name, doc_version, False, "Contradiction detected: policy mandates action claimed as 'never' allowed."
        if "prohibited" in claim_lower and "allowed" in doc_lower:
            return ClaimVerdict.CONTRADICTED, matched_doc_name, doc_version, False, "Contradiction detected: policy allows action claimed as prohibited."

        # Overlap threshold
        words = [w for w in re.findall(r"\w+", claim_lower) if len(w) > 3]
        overlap_ratio = sum(1 for w in words if w in doc_lower) / max(len(words), 1)

        # Gemini-powered semantic reasoning for ambiguous or general semantic claims
        if self.provider and 0.15 <= overlap_ratio < 0.70:
            try:
                eval_prompt = (
                    f"You are an academic regulations compliance judge. Evaluate whether the CLAIM is supported, contradicted, or unsupported by the official EXCERPT.\n\n"
                    f"EXCERPT:\n{matched_doc_content[:1500]}\n\n"
                    f"CLAIM:\n{claim}\n\n"
                    f"Output strictly in this format: VERDICT: [SUPPORTED or CONTRADICTED or UNSUPPORTED] | REASON: [one sentence explanation]"
                )
                gemini_eval = self.provider.generate_text(eval_prompt)
                if "VERDICT: CONTRADICTED" in gemini_eval.upper() or "CONTRADICTED" in gemini_eval.upper():
                    return ClaimVerdict.CONTRADICTED, matched_doc_name, doc_version, False, f"Gemini semantic judge detected contradiction: {gemini_eval.strip()}"
                elif "VERDICT: SUPPORTED" in gemini_eval.upper() or "SUPPORTED" in gemini_eval.upper():
                    return ClaimVerdict.SUPPORTED, matched_doc_name, doc_version, False, f"Gemini semantic judge confirmed grounding: {gemini_eval.strip()}"
                elif "VERDICT: UNSUPPORTED" in gemini_eval.upper():
                    return ClaimVerdict.UNSUPPORTED, matched_doc_name, doc_version, False, f"Gemini semantic judge determined unsupported: {gemini_eval.strip()}"
            except Exception as e:
                logger.warning(f"Gemini grounding semantic check warning: {e}")

        if overlap_ratio >= 0.70:
            return ClaimVerdict.SUPPORTED, matched_doc_name, doc_version, False, f"Semantic grounding confirmed with {overlap_ratio*100:.0f}% concept overlap."
        elif overlap_ratio >= 0.25:
            return ClaimVerdict.UNVERIFIABLE, matched_doc_name, doc_version, False, "Claim has ambiguous/partial keyword overlap with source but lacks conclusive substantiation."
        else:
            return ClaimVerdict.UNSUPPORTED, matched_doc_name, doc_version, False, "Claim is unsupported: insufficient document corroboration."
