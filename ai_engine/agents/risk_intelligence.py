"""
QualiTrust AI — Agent 2: Risk Intelligence Agent
Maps application profiles and context to a validated risk register using the agreed taxonomy.
Computes deterministic priority score (likelihood * impact) and enforces coverage policies.
"""

from __future__ import annotations
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from shared.schemas.contracts import Risk, RiskCategory, RiskStatus
from ai_engine.schemas.profile import ApplicationProfile
from ai_engine.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class RiskIntelligenceAgent:
    """
    Agent 2 responsible for identifying quality, safety, security, and operational risks.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider

    def analyze_risks(
        self,
        application_id: UUID,
        profile: ApplicationProfile,
        risk_config: Optional[Dict[str, Any]] = None,
    ) -> List[Risk]:
        """
        Derives risks from the profile components, domain sensitivity, and historical patterns.
        """
        risks: List[Risk] = []
        risk_config = risk_config or {}

        # 1. RAG Grounding Risk
        if profile.inventory.rag or profile.architecture_type == "rag":
            risks.append(
                Risk(
                    application_id=application_id,
                    category=RiskCategory.GROUNDING.value,
                    description="Hallucination or citation mismatch: Generating answers not backed by indexed knowledge base.",
                    likelihood=4,
                    impact=4,
                    priority_score=16.0,
                    status=RiskStatus.OPEN,
                    component_target="RAG Retriever / Context Augmented Prompt",
                    justification="High impact in enterprise decisions if generated claims contradict ground truth documentation.",
                )
            )

        # 2. Prompt Injection & Jailbreak Risk (Mandatory coverage)
        risks.append(
            Risk(
                application_id=application_id,
                category=RiskCategory.PROMPT_INJECTION.value,
                description="Direct or indirect instruction override manipulating model behavior or extracting system instructions.",
                likelihood=4,
                impact=5,
                priority_score=20.0,
                status=RiskStatus.OPEN,
                component_target="System Prompt & Input Processing",
                justification="Critical security requirement. Mandatory evaluation regardless of normal priority threshold.",
            )
        )

        # 3. Privacy & Sensitive Data Leakage
        risks.append(
            Risk(
                application_id=application_id,
                category=RiskCategory.PRIVACY.value,
                description="Unauthorized disclosure of PII, API tokens, internal paths, or training secrets via adversarial prompting.",
                likelihood=3,
                impact=5,
                priority_score=15.0,
                status=RiskStatus.OPEN,
                component_target="Model Generation Layer",
                justification="Severe regulatory compliance impact (GDPR, HIPAA, corporate confidentiality).",
            )
        )

        # 4. Tool Security Risk
        if profile.inventory.tools:
            risks.append(
                Risk(
                    application_id=application_id,
                    category=RiskCategory.TOOL_SECURITY.value,
                    description="Unsanitized tool invocation: injection of unauthorized commands or parameter manipulation into external tools.",
                    likelihood=3,
                    impact=5,
                    priority_score=15.0,
                    status=RiskStatus.OPEN,
                    component_target="Tool Execution Router",
                    justification="Tools interact with external infrastructure or databases, making injection dangerous.",
                )
            )

        # 5. Factual Accuracy
        risks.append(
            Risk(
                application_id=application_id,
                category=RiskCategory.ACCURACY.value,
                description="Factual inaccuracies, erroneous calculation, or invalid entity references in responses.",
                likelihood=3,
                impact=4,
                priority_score=12.0,
                status=RiskStatus.OPEN,
                component_target="Model Reasoning",
                justification="Fundamental application quality expectation.",
            )
        )

        # 6. Consistency
        if profile.architecture_type == "multi_turn" or "multi_turn" in profile.confirmed_capabilities:
            risks.append(
                Risk(
                    application_id=application_id,
                    category=RiskCategory.CONSISTENCY.value,
                    description="Contradictory responses or persona drift across sequential conversational turns.",
                    likelihood=3,
                    impact=3,
                    priority_score=9.0,
                    status=RiskStatus.OPEN,
                    component_target="Session Memory State",
                    justification="User trust degrades when answers self-contradict in a dialogue.",
                )
            )

        # 7. Safety & Policy Compliance
        risks.append(
            Risk(
                application_id=application_id,
                category=RiskCategory.SAFETY.value,
                description="Generation of harmful, biased, profane, or policy-violating text.",
                likelihood=2,
                impact=5,
                priority_score=10.0,
                status=RiskStatus.OPEN,
                component_target="Safety Guardrails",
                justification="Reputational and legal risk.",
            )
        )

        # 8. Custom Risks from Configuration
        custom_risks = risk_config.get("custom_risks", [])
        for cr in custom_risks:
            likelihood = int(cr.get("likelihood", 3))
            impact = int(cr.get("impact", 3))
            risks.append(
                Risk(
                    application_id=application_id,
                    category=cr.get("category", RiskCategory.CUSTOM.value),
                    description=cr.get("description", "Custom user-defined risk"),
                    likelihood=likelihood,
                    impact=impact,
                    priority_score=float(likelihood * impact),
                    status=RiskStatus.OPEN,
                    component_target=cr.get("component_target", "Application Custom Component"),
                    justification=cr.get("justification", "User specified risk policy."),
                )
            )

        # Sort risks deterministically by priority score descending
        risks.sort(key=lambda r: r.priority_score, reverse=True)
        return risks

