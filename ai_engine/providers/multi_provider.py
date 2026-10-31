"""
QualiTrust AI — Multi-Provider Implementation
Supports LangChain models with bounded retry & Pydantic validation, plus a deterministic Mock provider.
"""

from __future__ import annotations
import os
import json
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

from ai_engine.providers.base import BaseLLMProvider, LLMConfig

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class StructuredOutputValidationError(Exception):
    def __init__(self, message: str, errors: List[Any], raw_output: str):
        super().__init__(message)
        self.errors = errors
        self.raw_output = raw_output


class MockDeterministicLLMProvider(BaseLLMProvider):
    """
    Deterministic provider used for unit tests, offline benchmarks,
    and safe execution when no API keys are provided.
    """

    def __init__(self, config: Optional[LLMConfig] = None):
        super().__init__(config or LLMConfig(provider="mock", model_name="mock-engine"))
        self._custom_responses: Dict[str, Any] = {}

    def register_response(self, key: str, response: Any):
        self._custom_responses[key] = response

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        for k, v in self._custom_responses.items():
            if k.lower() in prompt.lower():
                return v if isinstance(v, str) else json.dumps(v)
        return "Deterministic response for testing purposes."

    def generate_structured(
        self,
        schema: Type[T],
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> T:
        for k, v in self._custom_responses.items():
            if k.lower() in prompt.lower():
                if isinstance(v, dict):
                    return schema.model_validate(v)
                elif isinstance(v, str):
                    return schema.model_validate_json(v)

        # Fallback default instantiation if model allows or simple mock
        from pydantic_core import PydanticUndefined
        data = {}
        for name, field in schema.model_fields.items():
            if not field.is_required() and field.default is not PydanticUndefined:
                data[name] = field.default
            elif field.default_factory is not None:
                data[name] = field.default_factory()
            else:
                ann = field.annotation
                if ann == str or ann is str:
                    data[name] = f"mock_{name}"
                elif ann == int or ann is int:
                    data[name] = 1
                elif ann == float or ann is float:
                    data[name] = 0.95
                elif ann == bool or ann is bool:
                    data[name] = True
                elif getattr(ann, "__origin__", None) is list:
                    data[name] = []
                elif getattr(ann, "__origin__", None) is dict:
                    data[name] = {}
                else:
                    data[name] = "mock_value"
        return schema.model_validate(data)


class LangChainModelProvider(BaseLLMProvider):
    """
    Integrates LangChain Chat Models with bounded retry, schema enforcement,
    and fallback recovery.
    """

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self._chat_model = self._init_chat_model()

    def _init_chat_model(self):
        provider = self.config.provider.lower()
        api_key = self.config.get_api_key()

        if provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=self.config.model_name,
                temperature=self.config.temperature,
                max_tokens=self.config.max_output_tokens,
                timeout=self.config.timeout_seconds,
                max_retries=self.config.retry_limit,
                api_key=api_key or os.environ.get("OPENAI_API_KEY"),
            )
        elif provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=self.config.model_name,
                temperature=self.config.temperature,
                max_tokens=self.config.max_output_tokens,
                timeout=self.config.timeout_seconds,
                api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"),
            )
        elif provider in ["gemini", "google"]:
            from langchain_google_genai import ChatGoogleGenerativeAI
            resolved_key = (
                api_key
                or os.environ.get("GEMINI_API_KEY")
                or os.environ.get("GOOGLE_API_KEY")
            )
            if not resolved_key:
                raise ValueError("GEMINI_API_KEY environment variable is not configured.")
            return ChatGoogleGenerativeAI(
                model=self.config.model_name or "gemini-3-flash-preview",
                temperature=self.config.temperature,
                timeout=self.config.timeout_seconds,
                max_retries=1,
                google_api_key=resolved_key,
            )
        else:
            return None

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if self._chat_model is None:
            if self.config.provider.lower() in ["gemini", "google", "openai", "anthropic"]:
                raise RuntimeError(f"Real provider '{self.config.provider}' was configured but model initialization failed. Silent fallback is prohibited.")
            return MockDeterministicLLMProvider(self.config).generate_text(prompt, system_prompt)

        from langchain_core.messages import SystemMessage, HumanMessage
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))

        response = self._chat_model.invoke(messages)
        if isinstance(response.content, list):
            return "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in response.content)
        return str(response.content)

    def generate_structured(
        self,
        schema: Type[T],
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> T:
        if self._chat_model is None:
            if self.config.provider.lower() in ["gemini", "google", "openai", "anthropic"]:
                raise RuntimeError(f"Real provider '{self.config.provider}' was configured but model initialization failed. Silent fallback is prohibited.")
            return MockDeterministicLLMProvider(self.config).generate_structured(schema, prompt, system_prompt)

        # Attempt structured output with retry limit
        last_error = None
        raw_output = ""
        for attempt in range(1, self.config.retry_limit + 1):
            try:
                structured_llm = self._chat_model.with_structured_output(schema)
                from langchain_core.messages import SystemMessage, HumanMessage
                messages = []
                if system_prompt:
                    messages.append(SystemMessage(content=system_prompt))
                
                feedback_prompt = prompt
                if attempt > 1 and last_error:
                    feedback_prompt += f"\n\n[Correction Note] Previous attempt produced validation error: {str(last_error)}. Please output strictly valid JSON matching the schema."

                messages.append(HumanMessage(content=feedback_prompt))
                result = structured_llm.invoke(messages)
                if isinstance(result, schema):
                    return result
                elif isinstance(result, dict):
                    return schema.model_validate(result)
            except Exception as e:
                logger.warning(f"Structured output generation attempt {attempt} failed: {e}")
                last_error = e

        raise StructuredOutputValidationError(
            f"Failed to generate valid structured output for {schema.__name__} after {self.config.retry_limit} attempts",
            errors=[str(last_error)],
            raw_output=raw_output,
        )


def get_llm_provider(config: Optional[LLMConfig] = None) -> BaseLLMProvider:
    if (
        config is None
        or config.provider == "mock"
        or config.provider.lower() not in ("openai", "anthropic", "gemini", "google")
    ):
        return MockDeterministicLLMProvider(config)
    try:
        return LangChainModelProvider(config)
    except Exception as e:
        logger.warning(f"Could not initialize provider {config.provider}: {e}. Falling back to deterministic mock.")
        return MockDeterministicLLMProvider(config)

