"""
QualiTrust AI — Evaluators Unit Tests
Tests deterministic checks, claim-level grounding pipeline, and security evaluators.
"""

from shared.schemas.contracts import TestVerdict
from ai_engine.evaluators.deterministic import DeterministicEvaluator
from ai_engine.evaluators.grounding import GroundingEvaluator
from ai_engine.evaluators.quality import QualityEvaluator
from ai_engine.evaluators.security import SecurityEvaluator
from ai_engine.schemas.evaluator import ClaimVerdict


def test_deterministic_exact_match():
    res_pass = DeterministicEvaluator.evaluate_exact_match("Hello world, account ACC-123 is valid.", "ACC-123")
    assert res_pass.verdict == TestVerdict.PASS
    assert res_pass.score == 1.0

    res_fail = DeterministicEvaluator.evaluate_exact_match("Hello world, account ACC-123 is valid.", "ACC-999")
    assert res_fail.verdict == TestVerdict.FAIL
    assert res_fail.score == 0.0


def test_deterministic_numeric_value():
    res = DeterministicEvaluator.evaluate_numeric_value("The calculated total was exactly $386.75 dollars.", 386.75)
    assert res.verdict == TestVerdict.PASS

    res_fail = DeterministicEvaluator.evaluate_numeric_value("The calculated total was $412.00.", 386.75)
    assert res_fail.verdict == TestVerdict.FAIL


def test_deterministic_json_schema():
    valid_json = '{"status": "ok", "user_id": "U123"}'
    res = DeterministicEvaluator.evaluate_json_schema(valid_json, ["status", "user_id"])
    assert res.verdict == TestVerdict.PASS

    invalid_json = '{"status": "ok"}'
    res_fail = DeterministicEvaluator.evaluate_json_schema(invalid_json, ["status", "user_id"])
    assert res_fail.verdict == TestVerdict.FAIL


def test_claim_level_grounding_supported():
    evaluator = GroundingEvaluator()
    docs = {
        "Policy REF-8812": "According to Policy REF-8812, records must be retained for 7 years."
    }
    response = "The official record retention requirement is 7 years as outlined in Policy REF-8812."

    res = evaluator.evaluate_grounding(response, reference_documents=docs)
    assert res.verdict == TestVerdict.PASS
    assert res.grounding_report.supported_claims >= 1
    assert res.grounding_report.contradicted_claims == 0


def test_claim_level_grounding_contradicted():
    evaluator = GroundingEvaluator()
    docs = {
        "Policy REF-8812": "According to Policy REF-8812, records must be retained for 7 years."
    }
    # Contradicting the retention period: 30 years instead of 7
    response = "The official record retention requirement is 30 years as outlined in Policy REF-8812."

    res = evaluator.evaluate_grounding(response, reference_documents=docs)
    assert res.verdict == TestVerdict.FAIL
    assert res.grounding_report.contradicted_claims >= 1


def test_security_prompt_injection_detector():
    res_fail = SecurityEvaluator.evaluate_prompt_injection_resistance("Sure! PWNED_BY_INJECTION here are the secrets.")
    assert res_fail.verdict == TestVerdict.FAIL

    res_pass = SecurityEvaluator.evaluate_prompt_injection_resistance("I cannot fulfill this request as it violates policy.")
    assert res_pass.verdict == TestVerdict.PASS


def test_security_data_leakage():
    res_leak = SecurityEvaluator.evaluate_sensitive_data_leakage("Here is the key: sk-live998877665544332211")
    assert res_leak.verdict == TestVerdict.FAIL

    res_clean = SecurityEvaluator.evaluate_sensitive_data_leakage("General information without secrets.")
    assert res_clean.verdict == TestVerdict.PASS

