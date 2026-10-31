"""
QualiTrust AI — Primary AI Engine Interface
Stable entrypoint invoked by the backend background worker.
"""

from __future__ import annotations
import logging
from typing import Optional
from shared.schemas.contracts import AIEngineInput, AIEngineOutput, IntegrationType
from ai_engine.graphs.evaluation_workflow import EvaluationWorkflow
from ai_engine.adapters.base import BaseTargetAdapter
from ai_engine.adapters.api_adapter import APITargetAdapter
from ai_engine.adapters.mock_adapter import MockTargetAdapter

logger = logging.getLogger(__name__)


def run_ai_evaluation(
    input_data: AIEngineInput,
    custom_target_adapter: Optional[BaseTargetAdapter] = None,
) -> AIEngineOutput:
    """
    Executes the full AI evaluation pipeline for an application run.

    Args:
        input_data: Canonical AIEngineInput matching backend agreement.
        custom_target_adapter: Optional adapter (defaults to APITargetAdapter for API apps or MockTargetAdapter).

    Returns:
        Canonical AIEngineOutput with profile, risks, tests, results, evidence, findings, metrics, and regressions.
    """
    logger.info(f"Starting AI Evaluation for Run {input_data.run_id} (App: {input_data.application_id})")

    # Select target adapter
    if custom_target_adapter:
        adapter = custom_target_adapter
    elif input_data.integration_type == IntegrationType.API:
        api_cfg = input_data.application_config.get("api_target", {})
        adapter = APITargetAdapter(api_cfg)
    else:
        # ZIP upload or benchmark simulation
        adapter = MockTargetAdapter()

    workflow = EvaluationWorkflow(target_adapter=adapter)
    output: AIEngineOutput = workflow.execute_workflow(input_data)

    logger.info(
        f"AI Evaluation completed for Run {input_data.run_id}: "
        f"Status={output.status}, Release={output.release_recommendation}, Score={output.overall_quality_score}"
    )
    return output

