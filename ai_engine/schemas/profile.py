"""
QualiTrust AI — AI Engine Application Profile Schemas
Agent 1 Profile & Inventory representations.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class ObservationStatus(str, Enum):
    CONFIRMED = "confirmed"
    SUSPECTED = "suspected"
    NOT_OBSERVABLE = "not_observable"


class ModelIntegration(BaseModel):
    provider: str
    model_name: str
    purpose: str
    status: ObservationStatus = ObservationStatus.CONFIRMED
    call_sites: List[str] = Field(default_factory=list)


class PromptTemplateInfo(BaseModel):
    template_name: str
    file_path: Optional[str] = None
    system_instruction: Optional[str] = None
    input_variables: List[str] = Field(default_factory=list)
    has_injection_guard: bool = False
    status: ObservationStatus = ObservationStatus.CONFIRMED


class ToolDefinition(BaseModel):
    tool_name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    has_permission_check: bool = False
    status: ObservationStatus = ObservationStatus.CONFIRMED


class RAGConfig(BaseModel):
    retriever_type: Optional[str] = None
    vector_store: Optional[str] = None
    chunk_size: Optional[int] = None
    top_k: Optional[int] = None
    exposed_retrieval_context: bool = False
    source_documents: List[str] = Field(default_factory=list)
    status: ObservationStatus = ObservationStatus.CONFIRMED


class ComponentInventory(BaseModel):
    models: List[ModelIntegration] = Field(default_factory=list)
    prompts: List[PromptTemplateInfo] = Field(default_factory=list)
    tools: List[ToolDefinition] = Field(default_factory=list)
    rag: Optional[RAGConfig] = None
    external_apis: List[str] = Field(default_factory=list)


class ObservabilityLimit(BaseModel):
    component: str
    limitation: str
    impact_on_testing: str


class ApplicationProfile(BaseModel):
    application_name: str
    domain: str = "general"
    architecture_type: str = "llm_application"  # rag | agentic | prompt_based | multi_turn
    description: str = ""
    inventory: ComponentInventory = Field(default_factory=ComponentInventory)
    data_flow_hypotheses: List[str] = Field(default_factory=list)
    observability_limits: List[ObservabilityLimit] = Field(default_factory=list)
    confirmed_capabilities: List[str] = Field(default_factory=list)
    suspected_capabilities: List[str] = Field(default_factory=list)

