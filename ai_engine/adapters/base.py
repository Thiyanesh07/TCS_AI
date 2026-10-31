"""
QualiTrust AI — Target Adapter Interfaces
Contracts for dispatching test inputs to target AI applications.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from shared.schemas.contracts import TestCase


class TargetResponse(BaseModel):
    raw_response: Any
    latency_ms: float
    status_code: int = 200
    retrieved_context: Optional[Union[str, List[str]]] = None
    citations: List[Any] = Field(default_factory=list)
    error_message: Optional[str] = None
    is_error: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseTargetAdapter(ABC):
    @abstractmethod
    def execute(self, test_case: TestCase) -> TargetResponse:
        """Executes a test case against the target application."""
        pass
