# QualiTrust AI — Technical Implementation Audit Report

**Auditor**: Principal AI Engineer  
**Date**: 2026-10-31  
**Target Module**: `ai_engine` & `shared/schemas`  
**Execution Environment**: Conda Environment `qualitrust-ai` (Python 3.11.18)

---

## 1. Executive Summary

This technical audit inspected the actual source code, dependencies, execution paths, and integration readiness of the QualiTrust AI Engine against the product specifications in the Master Development Prompt.

### Summary Classification Matrix

| Component | Status Classification | Primary Finding |
| :--- | :--- | :--- |
| **A. Shared Contracts** | **IMPLEMENTED AND TESTED** | `AIEngineInput`, `AIEngineOutput`, and all core domain entities strictly match agreed backend schemas. |
| **B. Model Providers** | **PARTIALLY IMPLEMENTED** | Abstraction and mock provider exist. Package bindings for OpenAI, Anthropic, Gemini installed, but negative tests (auth fail, timeout, retry exhaustion) need verification. |
| **C. Five Logical Agents** | **PARTIALLY IMPLEMENTED (HEURISTIC)** | All 5 agents exist and produce valid contract objects, but currently rely on deterministic templates and rule heuristics rather than hybrid LLM reasoning. |
| **D. LangGraph Workflow** | **IMPLEMENTED AND TESTED** | 15-stage stateful graph compiles and runs; state carries all artifacts; requires `MemorySaver` checkpointing integration. |
| **E. API Target Adapter** | **IMPLEMENTED BUT NOT INTEGRATION-TESTED** | Real `httpx` logic implemented; requires live HTTP endpoint integration test for timeouts, auth, and error codes. |
| **F. Docker Sandbox Adapter** | **MOCK / PLACEHOLDER** | Container execution cannot proceed because the local Docker daemon is offline (`//./pipe/dockerDesktopLinuxEngine` not found). Safe fallback simulated. |
| **G. Microsoft PyRIT Adapter** | **MOCK / PLACEHOLDER** | `pyrit` package is not natively available; adapter operates using regex vulnerability signatures and simulated attack payloads. |
| **H. Ragas Adapter** | **PARTIALLY IMPLEMENTED** | Context unobservability fallback is functional; full Ragas metric evaluation package was pending installation. |
| **I. Multi-Dimensional Evaluators**| **IMPLEMENTED AND TESTED** | Deterministic checks and 8-stage claim-level grounding pipeline (with 4 verdicts) are fully verified and operational. |
| **J. Regression Lifecycle** | **IMPLEMENTED AND TESTED** | Confirmed findings generate versioned `RegressionRecommendation` objects that can be fed back into test planning. |
| **K. OpenTelemetry** | **IMPLEMENTED BUT NOT INTEGRATION-TESTED** | Span instrumentation code exists; needs an in-memory or console span exporter test to verify trace attribute capture and redaction. |
| **L. Synthetic Benchmark** | **IMPLEMENTED AND TESTED** | 14 test cases verified with 100% classification accuracy; needs expansion to 25+ cases with statistical precision/recall/F1 metrics. |

---

## 2. In-Depth Component Analysis

### A. Shared Contracts
- **Verification**: `shared/schemas/contracts.py` defines `AIEngineInput` and `AIEngineOutput` with UUIDs, ISO-8601 timestamps, and strict Pydantic v2 validation.
- **Backend Compatibility**: 100% compliant. Matches Master Prompt Section 7 & 8. `__test__ = False` added to prevent pytest name collisions.

### B. Model Providers
- **Verification**: `ai_engine/providers/multi_provider.py` contains `MockDeterministicLLMProvider` and `LangChainModelProvider`.
- **Gaps**: Error scenarios (invalid API keys, rate limit HTTP 429, socket timeout, and structured output retry exhaustion) must be verified with automated test suites.

### C. Five Logical Agents
1. **Agent 1 (Application Understanding)**: Discovers components, prompts, and observability limits from input dictionaries. Works reliably without external API costs, but does not use LLM for code AST parsing.
2. **Agent 2 (Risk Intelligence)**: Generates prioritized risk registers deterministically (`likelihood * impact`). Ensures prompt injection and privacy risks have priority $\ge 15$.
3. **Agent 3 (Adaptive Test Planner)**: Generates prioritized tests capped by `TestBudget`. Works reliably.
4. **Agent 4 (Failure Diagnosis)**: Distinguishes confirmed observations from root-cause hypotheses using structured heuristics.
5. **Agent 5 (Regression Intelligence)**: Generates versioned regression recommendations from confirmed findings with `pending_review` validation status.

### D. LangGraph Workflow
- **Verification**: 15 nodes in `ai_engine/graphs/evaluation_workflow.py`. Conditional edges route on unsupported application types and broken target connectivity.
- **State Preservation**: All raw responses, latencies, test results, findings, and evidence are stored in `AIEvaluationState`.
- **Improvement Needed**: Add `langgraph-checkpoint` `MemorySaver` to allow state snapshots and replay.

### E. Target API Adapter
- **Verification**: `ai_engine/adapters/api_adapter.py` supports GET/POST, headers, Bearer auth, timeout, and custom JSON path extraction.
- **Improvement Needed**: Needs an integration test against a live in-process HTTP mock server to verify HTTP 401, 404, 500, timeouts, and JSON parsing.

### F. Docker Sandbox Adapter
- **Verification**: `ai_engine/adapters/sandbox_adapter.py` attempts connection to `http://127.0.0.1:8080/sandbox/execute`. When unavailable, returns simulated fallback.
- **Host Status**: Docker CLI is version 28.5.1, but Docker Desktop daemon is not running on the host. Direct untrusted code execution cannot be safely performed on the host outside a container.

### G. Microsoft PyRIT Integration
- **Verification**: `ai_engine/adapters/pyrit_adapter.py` provides the required adapter interface. Because `pyrit` was not installed, it currently executes signature-based adversarial detection.
- **Status**: Formally marked as **MOCK / PLACEHOLDER (Adapter Interface)** as required by Section 8 of the prompt.

### H. Ragas Integration
- **Verification**: `ai_engine/adapters/ragas_adapter.py` correctly reports context-dependent metrics (`faithfulness`, `context_precision`, `context_recall`) as **unobservable** when the target omits retrieval context, falling back to claim grounding.

### I. Evaluators
- **Deterministic**: Exact match, numeric comparison ($14 \times \$32.50 \times 0.85 = \$386.75$), JSON schema key validation, and citation regex.
- **Claim Grounding**: 8-stage pipeline (`extract` $\rightarrow$ `type` $\rightarrow$ `retrieve` $\rightarrow$ `version_check` $\rightarrow$ `exact_fact_check` $\rightarrow$ `semantic_check` $\rightarrow$ `verdict` $\rightarrow$ `evidence`). Generates `supported`, `contradicted`, `unsupported`, and `unverifiable`.
- **Security**: Prompt injection marker detector, PII/SSN detector, and secret credential leak detector.

### J. Regression Intelligence
- Confirmed defects automatically generate `RegressionRecommendation` records preventing release regressions.

### K. OpenTelemetry Instrumentation
- Spans created across all 15 stages. Redacts sensitive credentials, tokens, and raw confidential code.
- Needs test verification using an `InMemorySpanExporter`.

### L. Synthetic Benchmark Suite
- Initial 14 cases achieved 100% classification.
- Must be expanded to 25+ diverse, independently labelled test cases with statistical metric calculations (Accuracy, Precision, Recall, F1).

