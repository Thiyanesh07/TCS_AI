"""
QualiTrust AI — Agent 5: Regression Intelligence Agent
Converts confirmed failure findings into versioned, deduplicated regression test recommendations.
"""

from __future__ import annotations
import logging
from typing import Any, Dict, List, Optional, Set
from uuid import UUID, uuid4
from shared.schemas.contracts import (
    Finding,
    FindingStatus,
    RegressionRecommendation,
    TestCase,
    TestCategory,
)
from ai_engine.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class RegressionIntelligenceAgent:
    """
    Agent 5 responsible for synthesizing regression test suites from confirmed defects.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider

    def generate_regression_suite(
        self,
        application_id: UUID,
        findings: List[Finding],
        test_cases_map: Dict[UUID, TestCase],
        existing_regressions: Optional[List[RegressionRecommendation]] = None,
        version_label: str = "v1.0.0",
    ) -> List[RegressionRecommendation]:
        """
        Creates actionable regression test cases for all confirmed findings,
        avoiding duplication with existing regression suites.
        """
        recommendations: List[RegressionRecommendation] = []
        seen_titles: Set[str] = set()

        if existing_regressions:
            for er in existing_regressions:
                seen_titles.add(er.title.lower().strip())

        for finding in findings:
            if finding.status not in (FindingStatus.CONFIRMED, FindingStatus.OPEN):
                continue

            # Find matching test case if possible
            matched_test: Optional[TestCase] = None
            for tc in test_cases_map.values():
                if tc.category.value == finding.risk_category or tc.title in finding.title:
                    matched_test = tc
                    break

            reg_title = f"Regression Gate: Guard against {finding.title}"
            if reg_title.lower().strip() in seen_titles:
                continue

            seen_titles.add(reg_title.lower().strip())

            test_input = matched_test.input if matched_test else f"Retest scenario for finding: {finding.title}"
            expected_behavior = (
                matched_test.expected_behaviour
                if matched_test
                else f"Resolution of finding: {finding.title}. Remediation: {finding.remediation_recommendation}"
            )
            cat = matched_test.category if matched_test else TestCategory.REGRESSION

            recommendations.append(
                RegressionRecommendation(
                    application_id=application_id,
                    original_failure_id=finding.id,
                    test_case_id=matched_test.id if matched_test else None,
                    title=reg_title,
                    category=cat,
                    input=test_input,
                    expected_behaviour=expected_behavior,
                    associated_risk_id=None,
                    version_created=version_label,
                    reason=f"Defect confirmed in run finding '{finding.title}'. Added to regression suite to prevent release regressions.",
                    validation_status="pending_review",
                )
            )

        return recommendations

