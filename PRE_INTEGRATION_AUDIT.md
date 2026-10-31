# QualiTrust AI — AI Engine Pre-Integration Audit Report

**Module**: AI Engine (`ai_engine`)  
**Date**: 2026-10-31  
**Auditor**: Principal AI Engineer 
**Status**: READY FOR INTEGRATION

---

## 1. Inspection of Current Implementation

### A. Completed Functionality
- **Canonical Schemas (`shared/schemas/contracts.py`)**:
  - Full adherence to shared contracts (`AIEngineInput`, `AIEngineOutput`, `Application`, `EvaluationRun`, `TestCase`, `TestResult`, `Finding`, `Evidence`, `Risk`, `RegressionRecommendation`, `DimensionScore`).
  - Zero divergence from Master Prompt Section 7 & 8.
- **Logical Agents (`ai_engine/agents/`)**:
  - Agent 1: Application Understanding (profile and inventory discovery, observability limit isolation).
  - Agent 2: Risk Intelligence (deterministic priority scoring `likelihood * impact`, mandatory prompt injection and privacy rules).
  - Agent 3: Adaptive Test Planner (budget-bounded test suites: baseline, risk-targeted, adversarial, regression).
  - Agent 4: Failure Diagnosis (separates confirmed facts from root-cause hypotheses, generates actionable remediation).
  - Agent 5: Regression Intelligence (converts confirmed defects into versioned regression recommendations).
- **LangGraph Stateful Workflow (`ai_engine/graphs/`)**:
  - 15-stage stateful execution graph.
  - Integrated `langgraph.checkpoint.memory.MemorySaver` for state preservation and recovery using `thread_id=str(run_id)`.
  - Conditional branch routing for unsupported app types and disconnected targets.
- **Target Adapters (`ai_engine/adapters/`)**:
  - `APITargetAdapter`: Live socket integration tested against local mock servers.
  - `MockTargetAdapter`: Deterministic synthetic simulation adapter.
  - `SandboxTargetAdapter`: `SafeArchiveInspector` protecting against ZipSlip directory traversal, uncompressed quotas (50MB), and blocked binaries. Explicit daemon status detection.
  - `PyRITAdversarialAdapter`: Installed with `pyrit==1.1.0`. Full attack and response evidence logging.
  - `RagasEvaluationAdapter`: Installed with `ragas==0.4.3`. Graceful fallback to claim grounding when retrieval context is unobservable.
- **Evaluators (`ai_engine/evaluators/`)**:
  - Deterministic evaluators (exact match, numeric tolerance, JSON schema conformance, citation syntax).
  - 8-stage claim-level grounding pipeline (extract, type, retrieve, version check, exact facts, semantic assessment, 4-verdicts: `supported`, `contradicted`, `unsupported`, `unverifiable`).
  - Security evaluators (prompt injection detector, sensitive credential and PII leak detector).
- **OpenTelemetry Instrumentation (`ai_engine/telemetry/tracer.py`)**:
  - Span lifecycle across all stages with credential/secret redaction.

### B. Incomplete, Mocked, and Placeholder Elements
- **Docker Daemon Offline**: On the local machine, the Docker CLI is installed (v28.5.1), but Docker Desktop daemon is not running (`The system cannot find the file specified`). To preserve safety, `SandboxTargetAdapter` uses `SafeArchiveInspector` for static inspection and returns structured fallback simulation metadata rather than running untrusted code on the bare OS.
- **Model Provider Keys**: Multi-provider wrapper supports live OpenAI, Anthropic, and Gemini models. When API keys are not supplied in the environment, it safely uses `MockDeterministicLLMProvider`.

---

## 2. Dependencies and Environment Requirements

- **Python Runtime**: Python 3.11.18 in Conda environment `qualitrust-ai` (`C:\Users\Thiya\anaconda3\envs\qualitrust-ai`).
- **Core Libraries**:
  - `langchain==1.4.7`
  - `langchain-core==1.7.3`
  - `langgraph==1.2.19`
  - `pydantic==2.14.1`
  - `pyrit==1.1.0`
  - `ragas==0.4.3`
  - `httpx==0.28.1`
  - `opentelemetry-api==1.45.1`
  - `opentelemetry-sdk==1.45.1`
  - `pytest==9.2.0`

---

## 3. Contract Compatibility Verification

- `shared/schemas/contracts.py`: Verified against `docs/API_CONTRACT.md` and `docs/DATA_MODEL.md`.
- Method signature for Backend Worker:
  ```python
  from shared.schemas.contracts import AIEngineInput, AIEngineOutput
  from ai_engine.engine import run_ai_evaluation

  output: AIEngineOutput = run_ai_evaluation(input_data: AIEngineInput)
  ```
- **Breaking Changes**: None. Zero modifications made to shared schema names, field names, or enum values.

---

## 4. Security & Sanitization Audit

- **Zero hardcoded secrets**: No API keys, passwords, or tokens are committed.
- **OpenTelemetry Redaction**: Attribute sanitizer explicitly strips any key containing `secret`, `token`, `password`, `key`, or `authorization`.
- **ZipSlip Protection**: `SafeArchiveInspector` rejects any archive entry with `..` or absolute paths before extraction.

