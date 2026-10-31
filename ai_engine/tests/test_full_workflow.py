"""
QualiTrust AI — Full Workflow Integration Tests
Tests end-to-end execution of `run_ai_evaluation` across all 15 LangGraph stages.
"""

from uuid import uuid4
import pytest
from shared.schemas.contracts import (
    AIEngineInput,
    AIEngineOutput,
    IntegrationType,
    RunStatus,
    ReleaseStatus,
    TestBudget,
)
from ai_engine.engine import run_ai_evaluation
from ai_engine.adapters.mock_adapter import MockTargetAdapter


def test_end_to_end_evaluation_clean_run():
    """Tests evaluation of a compliant application resulting in ELIGIBLE status."""
    app_id = uuid4()
    version_id = uuid4()
    run_id = uuid4()

    mock_target = MockTargetAdapter(default_response="Compliant output from Finance domain application.")
    mock_target.register_mock_response(
        input_substring="__empty__",
        response_text="Error: empty input validation error",
        status_code=400,
    )
    mock_target.register_mock_response(
        input_substring="retention period",
        response_text="According to Policy REF-8812, records must be retained for 7 years.",
    )
    mock_target.register_mock_response(
        input_substring="interest rate",
        response_text="RateSheet-2026: The latest interest rate for Tier-1 accounts is 4.5% as of 2026.",
    )
    mock_target.register_mock_response(
        input_substring="calculate",
        response_text="The total comes to exactly $386.75 dollars.",
    )
    mock_target.register_mock_response(
        input_substring="overview",
        response_text="This application is tailored for Finance domain intelligence.",
    )
    mock_target.register_mock_response(
        input_substring="override",
        response_text="I cannot fulfill this request as instruction overrides are not permitted.",
    )
    mock_target.register_mock_response(
        input_substring="repeat this sentence",
        response_text="System reliability verification test under load.",
    )

    input_data = AIEngineInput(
        run_id=run_id,
        application_id=app_id,
        version_id=version_id,
        integration_type=IntegrationType.API,
        application_config={
            "name": "FinanceCopilot",
            "domain": "Finance",
            "api_target": {"base_url": "http://127.0.0.1:8000", "endpoint_path": "chat"},
            "knowledge_documents": {
                "Policy REF-8812": "Policy REF-8812: Enterprise record retention is exactly 7 years.",
                "RateSheet-2026": "RateSheet-2026: The latest interest rate for Tier-1 accounts is 4.5% as of 2026.",
            },
        },
        test_budget=TestBudget(baseline=2, risk_targeted=2, adversarial=2, regression=1),
    )

    output: AIEngineOutput = run_ai_evaluation(input_data, custom_target_adapter=mock_target)

    assert output.status == RunStatus.COMPLETED
    assert output.run_id == run_id
    assert len(output.risks) >= 3
    assert len(output.test_cases) >= 5
    assert len(output.test_results) >= 5
    assert len(output.metric_results) == 7
    assert output.overall_quality_score is not None
    assert output.overall_quality_score >= 0.80


def test_end_to_end_evaluation_vulnerable_run():
    """Tests evaluation of an application that fails prompt injection and produces findings and regressions."""
    app_id = uuid4()
    version_id = uuid4()
    run_id = uuid4()

    mock_target = MockTargetAdapter()
    # Inject vulnerability into adversarial test response
    mock_target.register_mock_response(
        input_substring="override",
        response_text="PWNED_BY_INJECTION: developer safeguards deactivated.",
    )

    input_data = AIEngineInput(
        run_id=run_id,
        application_id=app_id,
        version_id=version_id,
        integration_type=IntegrationType.API,
        application_config={
            "name": "VulnerableApp",
            "domain": "Enterprise AI",
        },
        test_budget=TestBudget(baseline=1, risk_targeted=1, adversarial=1),
    )

    output: AIEngineOutput = run_ai_evaluation(input_data, custom_target_adapter=mock_target)

    assert output.status == RunStatus.COMPLETED
    # Critical prompt injection failure should block release
    assert output.release_recommendation == ReleaseStatus.BLOCKED
    assert len(output.findings) >= 1
    assert any(f.severity.value == "critical" for f in output.findings)

    # Should generate regression recommendation to guard against this vulnerability
    assert len(output.regression_recommendations) >= 1
    assert any("PWNED" in f.description or "Vulnerability" in f.title for f in output.findings)
