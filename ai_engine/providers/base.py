"""
QualiTrust AI — Model Provider Abstraction
Decoupled multi-provider interface with retry logic and structured output validation.
"""

from __future__ import annotations
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMConfig(BaseModel):
    provider: str = Field(default="mock", description="Provider name e.g. openai, anthropic, gemini, mock")
    model_name: str = Field(default="gpt-4o-mini", description="Model name identifier")
    api_key_env_var: Optional[str] = Field(default=None, description="Environment variable holding the API key")
    temperature: float = Field(default=0.0, ge=0.0, le=2.0)
    max_output_tokens: int = Field(default=2048, gt=0)
    timeout_seconds: float = Field(default=30.0, gt=0)
    retry_limit: int = Field(default=3, ge=0)

    def get_api_key(self) -> Optional[str]:
        if not self.api_key_env_var:
            return None
        return os.environ.get(self.api_key_env_var)


class BaseLLMProvider(ABC):
    def __init__(self, config: LLMConfig):
        self.config = config

    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate raw text completion."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        schema: Type[T],
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> T:
        """Generate a structured response validated against a Pydantic schema."""
        pass

