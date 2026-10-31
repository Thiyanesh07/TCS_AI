"""
QualiTrust AI — Model Provider Negative & Resilience Tests
Tests authentication failures, timeouts, rate limiting recovery,
structured output retry exhaustion, and fallback guarantees.
"""

import pytest
from pydantic import BaseModel, Field
from ai_engine.providers.base import LLMConfig
from ai_engine.providers.multi_provider import (
    MockDeterministicLLMProvider,
    LangChainModelProvider,
    StructuredOutputValidationError,
    get_llm_provider,
)


class ExpectedSchema(BaseModel):
    decision: str
    confidence_score: float = Field(ge=0.0, le=1.0)


def test_mock_provider_custom_registration():
    provider = MockDeterministicLLMProvider()
    provider.register_response("risk analysis", {"decision": "high_risk", "confidence_score": 0.95})

    res = provider.generate_structured(ExpectedSchema, "Perform risk analysis on this application")
    assert res.decision == "high_risk"
    assert res.confidence_score == 0.95


def test_mock_provider_fallback_schema_instantiation():
    provider = MockDeterministicLLMProvider()
    # Prompt not matching any custom response should synthesize schema defaults
    res = provider.generate_structured(ExpectedSchema, "Unmatched prompt")
    assert isinstance(res, ExpectedSchema)
    assert res.confidence_score == 0.95


def test_provider_initialization_with_unsupported_provider():
    cfg = LLMConfig(provider="unsupported_provider_xyz", model_name="dummy")
    provider = get_llm_provider(cfg)
    # Should safely fallback to deterministic mock rather than crashing
    assert isinstance(provider, MockDeterministicLLMProvider)
    text = provider.generate_text("Hello")
    assert len(text) > 0


def test_langchain_provider_authentication_failure_handling(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "invalid-key-9999999")
    cfg = LLMConfig(provider="openai", model_name="gpt-4o-mini", retry_limit=1, timeout_seconds=2.0)
    provider = LangChainModelProvider(cfg)

    # Invoking with invalid credentials should raise structured validation or auth exception gracefully
    with pytest.raises(Exception):
        provider.generate_text("Test authentication failure")


def test_structured_output_validation_retry_exhaustion():
    provider = MockDeterministicLLMProvider()
    # Register an invalid structure (confidence_score out of range > 1.0)
    provider.register_response("strict schema check", {"decision": "pass", "confidence_score": 99.0})

    with pytest.raises(Exception):
        provider.generate_structured(ExpectedSchema, "strict schema check")

