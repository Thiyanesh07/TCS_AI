"""
QualiTrust AI — Agent 1: Application Understanding Agent
Inspects application source code, API specifications, prompts, tools, and RAG configuration.
Constructs a structured ApplicationProfile with confirmed, suspected, and unobservable classifications.
"""

from __future__ import annotations
import os
import re
import logging
from typing import Any, Dict, List, Optional
from ai_engine.schemas.profile import (
    ApplicationProfile,
    ComponentInventory,
    ModelIntegration,
    PromptTemplateInfo,
    ToolDefinition,
    RAGConfig,
    ObservabilityLimit,
    ObservationStatus,
)
from ai_engine.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class ApplicationUnderstandingAgent:
    """
    Agent 1 responsible for static inspection, architecture profiling,
    and identifying observability limits.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider

    def analyze(
        self,
        app_name: str,
        integration_type: str,
        app_config: Dict[str, Any],
        discovery_report: Optional[Dict[str, Any]] = None,
    ) -> ApplicationProfile:
        """
        Builds a comprehensive ApplicationProfile from metadata, API specs,
        prompt templates, or discovery reports.
        """
        inventory = ComponentInventory()
        observability_limits: List[ObservabilityLimit] = []
        confirmed_caps: List[str] = []
        suspected_caps: List[str] = []
        data_flow_hypotheses: List[str] = []

        discovery_report = discovery_report or {}

        # 1. Inspect Model Integrations
        models_data = discovery_report.get("models") or app_config.get("models", [])
        if models_data:
            for m in models_data:
                inventory.models.append(
                    ModelIntegration(
                        provider=m.get("provider", "openai"),
                        model_name=m.get("model_name", "unknown"),
                        purpose=m.get("purpose", "general_generation"),
                        status=ObservationStatus.CONFIRMED,
                        call_sites=m.get("call_sites", []),
                    )
                )
                confirmed_caps.append(f"Model Integration: {m.get('provider')}/{m.get('model_name')}")
        else:
            # Suspect standard model integration if API or LLM type
            inventory.models.append(
                ModelIntegration(
                    provider="unknown",
                    model_name="unspecified",
                    purpose="inferred_llm_inference",
                    status=ObservationStatus.SUSPECTED,
                )
            )
            suspected_caps.append("Suspected LLM API endpoint")

        # 2. Inspect Prompts & Instruction Boundaries
        prompts_data = discovery_report.get("prompts") or app_config.get("prompts", [])
        for p in prompts_data:
            has_guard = bool(p.get("has_injection_guard") or "guard" in p.get("template_name", "").lower())
            inventory.prompts.append(
                PromptTemplateInfo(
                    template_name=p.get("name", "default_prompt"),
                    system_instruction=p.get("system_instruction"),
                    input_variables=p.get("variables", ["input"]),
                    has_injection_guard=has_guard,
                    status=ObservationStatus.CONFIRMED if "system_instruction" in p else ObservationStatus.SUSPECTED,
                )
            )
            confirmed_caps.append(f"Prompt Template: {p.get('name')}")

        # 3. Inspect RAG Components
        rag_data = discovery_report.get("rag") or app_config.get("rag")
        if rag_data:
            exposed_ctx = bool(rag_data.get("exposed_retrieval_context", False))
            inventory.rag = RAGConfig(
                retriever_type=rag_data.get("retriever_type", "vector_similarity"),
                vector_store=rag_data.get("vector_store", "chroma"),
                chunk_size=rag_data.get("chunk_size", 512),
                top_k=rag_data.get("top_k", 3),
                exposed_retrieval_context=exposed_ctx,
                source_documents=rag_data.get("source_documents", []),
                status=ObservationStatus.CONFIRMED,
            )
            confirmed_caps.append("RAG Pipeline Architecture")
            if not exposed_ctx:
                observability_limits.append(
                    ObservabilityLimit(
                        component="RAG Context Retrieval",
                        limitation="Target application does not expose internal retrieved chunks in API response.",
                        impact_on_testing="Ragas context precision/recall cannot be evaluated directly; falling back to claim grounding.",
                    )
                )
        else:
            # Check if domain documents exist
            docs = app_config.get("knowledge_documents") or []
            if docs:
                inventory.rag = RAGConfig(
                    exposed_retrieval_context=False,
                    source_documents=list(docs.keys()) if isinstance(docs, dict) else [str(d) for d in docs],
                    status=ObservationStatus.SUSPECTED,
                )
                suspected_caps.append("Knowledge Base Documents detected without explicit RAG telemetry")
                observability_limits.append(
                    ObservabilityLimit(
                        component="Knowledge Base Retrieval",
                        limitation="Retrieval internals unobservable at runtime.",
                        impact_on_testing="Evaluation will rely on reference knowledge grounding.",
                    )
                )

        # 4. Inspect Tool Usage
        tools_data = discovery_report.get("tools") or app_config.get("tools", [])
        for t in tools_data:
            inventory.tools.append(
                ToolDefinition(
                    tool_name=t.get("name", "unknown_tool"),
                    description=t.get("description", ""),
                    parameters=t.get("parameters", {}),
                    has_permission_check=t.get("has_permission_check", False),
                    status=ObservationStatus.CONFIRMED,
                )
            )
            confirmed_caps.append(f"Function/Tool: {t.get('name')}")

        # 5. External APIs
        inventory.external_apis = discovery_report.get("external_apis") or app_config.get("external_apis", [])

        # 6. Formulate Data Flow Hypotheses
        if inventory.rag:
            data_flow_hypotheses.append("User Query -> Vector Embedding -> Document Retrieval -> Augmented Prompt -> LLM Completion")
        elif inventory.tools:
            data_flow_hypotheses.append("User Query -> LLM Tool Call Decision -> Tool Execution -> Final Synthesis")
        else:
            data_flow_hypotheses.append("User Query -> System Prompt Boundary -> Direct LLM Inference -> Response")

        # Determine architecture type
        arch_type = "prompt_based"
        if inventory.rag:
            arch_type = "rag"
        elif inventory.tools:
            arch_type = "agentic"
        elif app_config.get("multi_turn"):
            arch_type = "multi_turn"

        return ApplicationProfile(
            application_name=app_name,
            domain=app_config.get("domain", "Enterprise AI"),
            architecture_type=arch_type,
            description=app_config.get("description", f"AI Application {app_name} with {arch_type} architecture."),
            inventory=inventory,
            data_flow_hypotheses=data_flow_hypotheses,
            observability_limits=observability_limits,
            confirmed_capabilities=confirmed_caps,
            suspected_capabilities=suspected_caps,
        )

