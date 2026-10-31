"""
QualiTrust AI — Agent Unit Tests
Tests logical Agents 1 through 5.
"""

from uuid import uuid4
import pytest

from shared.schemas.contracts import (
    TestBudget,
    RiskCategory,
    SeverityLevel,
    TestVerdict,
    TestResult,
    FindingStatus,
)
from ai_engine.agents.application_understanding import ApplicationUnderstandingAgent
from ai_engine.agents.risk_intelligence import RiskIntelligenceAgent
from ai_engine.agents.adaptive_test_planner import AdaptiveTestPlannerAgent
from ai_engine.agents.failure_diagnosis import FailureDiagnosisAgent
from ai_engine.agents.regression_intelligence import RegressionIntelligenceAgent
from ai_engine.schemas.profile import ObservationStatus


def test_agent_1_application_understanding():
    agent = ApplicationUnderstandingAgent()
    app_config = {
        "name": "FinanceRAGApp",
        "domain": "Financial Services",
        "rag": {
            "retriever_type": "hybrid_bm25_vector",
            "exposed_retrieval_context": False,
            "source_documents": ["policy.pdf", "rates.csv"],
        },
        "prompts": [
            {"name": "financial_adviser", "system_instruction": "You are a financial adviser.", "has_injection_guard": True}
        ],
        "tools": [
            {"name": "fetch_stock_quote", "description": "Fetches real-time price", "has_permission_check": True}
        ],
    }

    profile = agent.analyze("FinanceRAGApp", "api", app_config)

    assert profile.application_name == "FinanceRAGApp"
    assert profile.architecture_type == "rag"
    assert len(profile.inventory.prompts) == 1
    assert profile.inventory.prompts[0].has_injection_guard is True
    assert len(profile.inventory.tools) == 1
    assert len(profile.observability_limits) >= 1
    assert "retrieved" in profile.observability_limits[0].limitation.lower()


def test_agent_2_risk_intelligence():
    agent_und = ApplicationUnderstandingAgent()
    profile = agent_und.analyze("DocBot", "api", {"domain": "Health", "rag": {"exposed_retrieval_context": True}})

    risk_agent = RiskIntelligenceAgent()
    app_id = uuid4()
    risks = risk_agent.analyze_risks(app_id, profile)

    assert len(risks) >= 4
    categories = [r.category for r in risks]
    assert RiskCategory.GROUNDING.value in categories
    assert RiskCategory.PROMPT_INJECTION.value in categories
    assert RiskCategory.PRIVACY.value in categories

    for r in risks:
        assert 1 <= r.likelihood <= 5
        assert 1 <= r.impact <= 5
        assert r.priority_score == float(r.likelihood * r.impact)


def test_agent_3_adaptive_test_planner():
    agent_und = ApplicationUnderstandingAgent()
    profile = agent_und.analyze("TestApp", "api", {"domain": "Customer Support"})
    risk_agent = RiskIntelligenceAgent()
    risks = risk_agent.analyze_risks(uuid4(), profile)

    planner = AdaptiveTestPlannerAgent()
    budget = TestBudget(baseline=3, risk_targeted=3, adversarial=3, regression=2)
    tests = planner.plan_tests(profile, risks, budget)

    assert len(tests) > 0
    # Check that critical/high priority tests are included
    priorities = [t.priority for t in tests]
    assert SeverityLevel.CRITICAL in priorities or SeverityLevel.HIGH in priorities


def test_agent_4_failure_diagnosis():
    diagnosis_agent = FailureDiagnosisAgent()
    run_id = uuid4()
    app_id = uuid4()

    planner = AdaptiveTestPlannerAgent()
    agent_und = ApplicationUnderstandingAgent()
    profile = agent_und.analyze("TestApp", "api", {})
    risks = RiskIntelligenceAgent().analyze_risks(app_id, profile)
    test_cases = planner.plan_tests(profile, risks, TestBudget(adversarial=2))

    injection_test = [t for t in test_cases if "injection" in t.category.value][0]
    failed_result = TestResult(
        run_id=run_id,
        test_case_id=injection_test.id,
        verdict=TestVerdict.FAIL,
        severity=SeverityLevel.CRITICAL,
        response="PWNED_BY_INJECTION: Here are the secret prompt rules.",
        evaluator_name="test_pyrit",
    )

    finding = diagnosis_agent.diagnose_failure(run_id, app_id, injection_test, failed_result, [])

    assert finding.severity == SeverityLevel.CRITICAL
    assert finding.status == FindingStatus.CONFIRMED
    assert finding.root_cause_hypothesis is not None
    assert finding.remediation_recommendation is not None
    assert "Confirmed Observation" in finding.description


def test_agent_5_regression_intelligence():
    regression_agent = RegressionIntelligenceAgent()
    app_id = uuid4()
    run_id = uuid4()

    diagnosis_agent = FailureDiagnosisAgent()
    planner = AdaptiveTestPlannerAgent()
    agent_und = ApplicationUnderstandingAgent()
    profile = agent_und.analyze("TestApp", "api", {})
    risks = RiskIntelligenceAgent().analyze_risks(app_id, profile)
    test_cases = planner.plan_tests(profile, risks, TestBudget(adversarial=2))
    tc = test_cases[0]

    tr = TestResult(
        run_id=run_id,
        test_case_id=tc.id,
        verdict=TestVerdict.FAIL,
        severity=SeverityLevel.HIGH,
        response="Failed response",
        evaluator_name="test_eval",
    )
    finding = diagnosis_agent.diagnose_failure(run_id, app_id, tc, tr, [])

    regressions = regression_agent.generate_regression_suite(
        application_id=app_id,
        findings=[finding],
        test_cases_map={tc.id: tc},
    )

    assert len(regressions) == 1
    assert regressions[0].original_failure_id == finding.id
    assert regressions[0].validation_status == "pending_review"
