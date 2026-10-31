# QualiTrust AI — AI Engine Prioritized Completion Plan

**Author**: Principal AI Engineer  
**Date**: 2026-10-31  

Based on the findings from `AI_ENGINE_AUDIT.md`, this completion plan outlines the prioritized execution path.

---

## Phase P0: Core Target Integration & Execution Reliability
- [ ] **P0.1: Live API Target Integration Testing**:
  Deploy an in-process live HTTP test server (`starlette`/`uvicorn` or `http.server`) to verify:
  - Real socket communication over localhost.
  - Bearer token authentication header transmission.
  - Request payload formation (JSON dict, message lists, raw text).
  - Response parsing, JSON path extraction, and HTTP 401/404/500 handling.
  - Timeout enforcement.
- [ ] **P0.2: Safe Sandbox Application Isolation & Docker Fallback**:
  - Implement a dedicated `SafeArchiveInspector` for ZIP application bundles that verifies file paths against directory traversal (ZipSlip), checks maximum uncompressed size, and rejects dangerous binary executables.
  - Provide a safe Python sandbox execution harness that enforces resource and timeout constraints.
  - Clearly label Docker container execution as active or fallback-simulated based on Docker daemon availability.
- [ ] **P0.3: LangGraph Checkpointing & State Snapshotting**:
  - Integrate `langgraph.checkpoint.memory.MemorySaver` into `EvaluationWorkflow`.
  - Verify workflow state recovery and audit event persistence.
- [ ] **P0.4: Model Provider Negative Scenarios**:
  - Test authentication failures, timeouts, rate limiting (HTTP 429), structured output retry exhaustion, and fallback recovery.

---

## Phase P1: Evaluator & Adversarial Hardening
- [ ] **P1.1: Microsoft PyRIT Compatible Interface Hardening**:
  - Ensure adapter preserves full attack input, target response, evaluation verdict, and forensic evidence.
  - Add explicit adapter status labelling (`adapter_status="adapter_interface_active"`).
- [ ] **P1.2: Ragas Integration with Real Package / Grounding Fallback**:
  - Verify Ragas execution when installed; ensure unobservable context fallback gracefully switches to claim-level grounding without failing.
- [ ] **P1.3: Adaptive Test Feedback Loop & Regression Re-Execution**:
  - Enable regression test execution directly through `run_ai_evaluation` when previous failure IDs are supplied.

---

## Phase P2: Statistical Benchmark & Telemetry Verification
- [ ] **P2.1: Expanded Benchmark Suite (25+ Scenarios)**:
  - Expand benchmark coverage from 14 to 25+ diverse cases.
  - Compute statistical metrics: Accuracy, Precision, Recall, F1-Score, False Positives, False Negatives, and Uncertain counts.
- [ ] **P2.2: OpenTelemetry Exporter Integration Test**:
  - Wire an `InMemorySpanExporter` in tests to assert span creation, stage duration tracking, and secret redaction.
- [ ] **P2.3: Production Documentation & Handoff**:
  - Update `docs/memory/ai.md`, `docs/INTEGRATION_STATUS.md`, and verify all tests pass.

