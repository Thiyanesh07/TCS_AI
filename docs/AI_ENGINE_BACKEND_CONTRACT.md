# QualiTrust AI — AI Engine & Backend Integration Contract
**Document ID**: `QUALITRUST-CONTRACT-BACKEND-AI-01`  
**Date**: 2026-10-31  
**Target Audience**: Backend Engineers, Platform Architects, QA Automation Engineers  

---

## 1. Stable Entry Point Specification

The AI Engine is exposed as a single, decoupled, synchronous/worker-callable Python function:

```python
from ai_engine.engine import run_ai_evaluation
from shared.schemas.contracts import AIEngineInput, AIEngineOutput

def run_ai_evaluation(
    input_data: AIEngineInput,
    custom_target_adapter: Optional[BaseTargetAdapter] = None,
) -> AIEngineOutput: ...
```

### Key Design Guarantees
1. **Zero Web Framework Dependency**: The AI Engine does NOT import FastAPI, Starlette, or Uvicorn. It executes inside any thread pool, Celery worker process, or standard Python runner.
2. **Deterministic Contract Enactment**: Inputs and outputs are strictly validated against `shared/schemas/contracts.py`.
3. **Internal Agent Encapsulation**: The backend never needs to import individual logical agents (`ApplicationUnderstandingAgent`, `RiskIntelligenceAgent`, etc.). The 15-stage LangGraph workflow is entirely managed internally.

---

## 2. Input Schema: `AIEngineInput`

```python
class AIEngineInput(BaseModel):
    run_id: UUID
    application_id: UUID
    version_id: UUID
    integration_type: IntegrationType  # "zip" | "api"
    application_config: Dict[str, Any] = Field(default_factory=dict)
    discovery_report: Optional[Dict[str, Any]] = None
    risk_config: Optional[Dict[str, Any]] = None
    evaluation_config: Optional[Dict[str, Any]] = None
    test_budget: TestBudget = Field(default_factory=TestBudget)
```

### Field Definitions & Requirements

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `run_id` | `UUID` | **Yes** | Unique evaluation run identifier created by the backend. | `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d` |
| `application_id` | `UUID` | **Yes** | Parent application UUID. | `123e4567-e89b-12d3-a456-426614174000` |
| `version_id` | `UUID` | **Yes** | Target application version UUID. | `223e4567-e89b-12d3-a456-426614174001` |
| `integration_type`| `IntegrationType`| **Yes** | Either `"zip"` (archive package) or `"api"` (HTTP target). | `"api"` or `"zip"` |
| `application_config`| `Dict[str, Any]`| **Yes** | Target connection configuration: for API, includes `base_url`, `endpoint_path`, `auth_token`; for ZIP, includes `archive_path`. | `{"base_url": "http://127.0.0.1:8000", "endpoint_path": "chat"}` |
| `discovery_report`| `Optional[Dict]` | No | Optional static inspection results from the backend. | `{"manifest": {"name": "Bot"}, "files": 10}` |
| `risk_config` | `Optional[Dict]` | No | Custom risk policy overrides or focus areas. | `{"focus_areas": ["security", "grounding"]}` |
| `evaluation_config`| `Optional[Dict]`| No | Evaluator tuning (e.g. thresholds, timeouts). | `{"grounding_threshold": 0.85}` |
| `test_budget` | `TestBudget` | No | Budget ceilings for tests: `baseline`, `risk_targeted`, `adversarial`, `regression`. | `TestBudget(baseline=10, risk_targeted=10)` |

---

## 3. Output Schema: `AIEngineOutput`

```python
class AIEngineOutput(BaseModel):
    run_id: UUID
    application_id: UUID
    version_id: UUID
    status: RunStatus  # "completed" | "failed"
    application_profile: Dict[str, Any]
    risks: List[Risk]
    test_cases: List[TestCase]
    test_results: List[TestResult]
    evidence: List[Evidence]
    findings: List[Finding]
    metric_results: Dict[str, DimensionScore]
    overall_quality_score: Optional[float]
    release_recommendation: ReleaseStatus  # "eligible" | "blocked" | "review_required"
    regression_recommendations: List[RegressionRecommendation]
    trace_metadata: Dict[str, Any]
    execution_notes: List[str]
```

### Field Mappings to PostgreSQL Database Tables

| Output Field | Target Database Table | Storage Format | Description |
| :--- | :--- | :--- | :--- |
| `status` | `evaluation_runs.status` | `VARCHAR` | `"completed"` or `"failed"` |
| `overall_quality_score` | `evaluation_runs.quality_score` | `FLOAT` / `DOUBLE` | Aggregate score between 0.0 and 1.0 |
| `release_recommendation`| `evaluation_runs.release_status`| `VARCHAR` | `"eligible"`, `"blocked"`, `"review_required"` |
| `risks` | `risks` table | Rows (1 row per Risk) | Identified risks with likelihood, impact, and priority score |
| `test_cases` | `test_cases` table | Rows (1 row per TestCase) | Synthesized test cases with inputs and expected behavior |
| `test_results` | `test_results` table | Rows (1 row per TestResult) | Verdicts (`pass`/`fail`), response text, latencies |
| `evidence` | `evidences` table | Rows (1 row per Evidence) | Cryptographic SHA-256 hashes, excerpts, and references |
| `findings` | `findings` table | Rows (1 row per Finding) | Diagnosed defects, root causes, and remediations |
| `metric_results` | `evaluation_runs.dimension_scores` | `JSONB` | Score breakdown per dimension (accuracy, grounding, etc.) |
| `regression_recommendations`| `regression_tests` table | Rows (Pending review) | Reusable regression test cases for future runs |

---

## 4. Backend Worker Integration Pattern

Here is the exact implementation to place in `backend/workers/evaluation_worker.py`:

```python
import logging
from uuid import UUID
from sqlalchemy.orm import Session
from shared.schemas.contracts import (
    AIEngineInput,
    AIEngineOutput,
    RunStatus,
    IntegrationType,
)
from ai_engine.engine import run_ai_evaluation
from backend.models import EvaluationRun, Application, ApplicationVersion, db_session

logger = logging.getLogger(__name__)

def execute_evaluation_job(run_id: UUID):
    """Background task executed by Celery or FastAPI BackgroundTasks."""
    with db_session() as db:
        run = db.query(EvaluationRun).filter_by(id=run_id).first()
        if not run:
            logger.error(f"Evaluation run {run_id} not found.")
            return

        # 1. Update status to RUNNING
        run.status = RunStatus.RUNNING
        db.commit()

        try:
            app = db.query(Application).filter_by(id=run.application_id).first()
            version = db.query(ApplicationVersion).filter_by(id=run.version_id).first()

            # 2. Assemble canonical AIEngineInput
            engine_input = AIEngineInput(
                run_id=run.id,
                application_id=app.id,
                version_id=version.id,
                integration_type=IntegrationType(app.integration_type),
                application_config=app.config_payload or {},
                discovery_report=app.discovery_payload,
            )

            # 3. Execute AI Evaluation
            logger.info(f"Invoking AI Engine for run {run_id}...")
            output: AIEngineOutput = run_ai_evaluation(engine_input)

            # 4. Persist Results
            run.status = output.status
            run.quality_score = output.overall_quality_score
            run.release_status = output.release_recommendation
            run.total_tests = len(output.test_cases)
            run.passed_tests = sum(1 for r in output.test_results if r.verdict == "pass")
            run.failed_tests = sum(1 for r in output.test_results if r.verdict == "fail")
            run.uncertain_tests = sum(1 for r in output.test_results if r.verdict == "uncertain")

            # Persist risks, findings, test results, and evidence
            _persist_evaluation_entities(db, output)
            db.commit()
            logger.info(f"Run {run_id} completed successfully. Release: {output.release_recommendation}")

        except Exception as e:
            logger.exception(f"Fatal error during AI evaluation run {run_id}: {e}")
            run.status = RunStatus.FAILED
            db.commit()
```

---

## 5. Sample Request & Response Payload

### Sample Input Payload (`AIEngineInput`)
```json
{
  "run_id": "77fb7713-f4c1-4637-ae20-7546403d20a4",
  "application_id": "c1388b77-cfc8-47c3-b097-4d924f35a092",
  "version_id": "84a1d528-912e-4b47-b8f2-892c90f238bc",
  "integration_type": "api",
  "application_config": {
    "api_target": {
      "base_url": "http://127.0.0.1:8000",
      "endpoint_path": "chat",
      "http_method": "POST"
    }
  },
  "test_budget": {
    "baseline": 5,
    "risk_targeted": 5,
    "adversarial": 3,
    "regression": 2
  }
}
```

### Sample Output Payload Excerpt (`AIEngineOutput`)
```json
{
  "run_id": "77fb7713-f4c1-4637-ae20-7546403d20a4",
  "application_id": "c1388b77-cfc8-47c3-b097-4d924f35a092",
  "version_id": "84a1d528-912e-4b47-b8f2-892c90f238bc",
  "status": "completed",
  "overall_quality_score": 0.745,
  "release_recommendation": "review_required",
  "metric_results": {
    "grounding": {
      "dimension": "grounding",
      "score": 0.88,
      "sample_size": 15,
      "passed_count": 12,
      "failed_count": 3
    },
    "security": {
      "dimension": "security",
      "score": 1.0,
      "sample_size": 3,
      "passed_count": 3,
      "failed_count": 0
    }
  },
  "findings": [
    {
      "id": "e0b9691b-c743-4dc7-a3f2-1ef02a7b6cf2",
      "title": "Groundedness Violation: Severe Attendance Shortage Inversion",
      "severity": "critical",
      "status": "open",
      "root_cause_hypothesis": "[Gemini Diagnosis] Model inverted Clause 7.4 boundary condition.",
      "remediation_recommendation": "[Gemini Recommendation] Enforce negative prompt constraints and claim filter."
    }
  ]
}
```

