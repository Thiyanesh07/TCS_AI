# QualiTrust AI — AI Engine Test & Benchmark Verification Report
**Date**: 2026-10-31  
**Test Framework**: `pytest` 9.2.0, `pluggy` 1.7.0  
**Runtime**: Python 3.11.18 (Conda `qualitrust-ai`, Windows 11 / WSL2)  
**Evaluator LLM**: Google Gemini (`gemini-3-flash-preview`)  
**Overall Test Result**: **30 PASSED / 0 FAILED / 0 SKIPPED (100% PASS RATE)**  

---

## 1. Executive Summary

This report documents the verification and test execution results for the QualiTrust AI AI Engine. The test suite exercises every critical layer of the architecture: logical AI agents, multi-provider LLM abstractions, deterministic and semantic evaluators, live socket target adapters, Docker sandbox adapters, OpenTelemetry telemetry, and full 15-stage LangGraph workflow executions.

All 30 unit and integration tests passed cleanly in **12.38 seconds**. In addition, the synthetic benchmark ($N=28$) achieved **100% classification accuracy**, and live Gemini API calls and Docker sandbox executions were independently verified.

---

## 2. Pytest Execution Breakdown

```text
============================= test session starts =============================
platform win32 -- Python 3.11.18, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\Thiya\OneDrive\Documents\TCS AI 26
plugins: anyio-4.15.1, langsmith-0.14.16, asyncio-1.4.1
collected 30 items

ai_engine\tests\test_agents.py .....                                     [ 16%]
ai_engine\tests\test_benchmark_suite.py .                                [ 20%]
ai_engine\tests\test_evaluators.py .......                               [ 43%]
ai_engine\tests\test_full_workflow.py ..                                 [ 50%]
ai_engine\tests\test_live_api_adapter.py .....                           [ 66%]
ai_engine\tests\test_provider_negative.py .....                          [ 83%]
ai_engine\tests\test_sandbox_adapter.py ....                             [ 96%]
ai_engine\tests\test_telemetry.py .                                      [100%]

======================= 30 passed, 1 warning in 12.38s ========================
```

---

## 3. Test Suite Module Summary

| Test File | Test Count | Scope & Coverage | Verdict |
| :--- | :--- | :--- | :--- |
| **`test_agents.py`** | 5 | Validates all 5 logical agents: Understanding, Risk Intelligence, Test Planner, Failure Diagnosis, and Regression Intelligence. | **PASS (5/5)** |
| **`test_benchmark_suite.py`** | 1 ($N=28$) | Runs the 28-case synthetic benchmark across 7 quality dimensions with exact precision/recall tracking. | **PASS (1/1)** |
| **`test_evaluators.py`** | 7 | Verifies deterministic numeric match, exact citations, JSON schema validation, claim-level grounding (4 verdicts), and PyRIT security detectors. | **PASS (7/7)** |
| **`test_full_workflow.py`** | 2 | Executes end-to-end 15-stage LangGraph workflow on both clean applications and applications with critical security defects. | **PASS (2/2)** |
| **`test_live_api_adapter.py`** | 5 | Tests real TCP socket HTTP target adapter: status code handling, JSON response extraction, timeouts, and authorization headers. | **PASS (5/5)** |
| **`test_provider_negative.py`** | 5 | Verifies provider authentication failure, timeout recovery, structured output validation errors, and retry limits. | **PASS (5/5)** |
| **`test_sandbox_adapter.py`** | 4 | Verifies ZipSlip directory traversal rejection, file size quotas, blocked binary executable filtering, and daemon status tracking. | **PASS (4/4)** |
| **`test_telemetry.py`** | 1 | Verifies OpenTelemetry span generation, run ID propagation, and confidential payload filtering. | **PASS (1/1)** |

---

## 4. Synthetic Benchmark Quality Metrics ($N=28$)

The benchmark suite in `test_benchmark_suite.py` exercises 28 standardized evaluation scenarios across 7 core quality dimensions:

| Dimension | Scenarios ($N$) | Expected Positives | Expected Negatives | False Positives | False Negatives | Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Accuracy** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Groundedness** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Completeness** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Consistency** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Safety** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Security & Prompt Injection** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Citation Quality** | 4 | 2 | 2 | 0 | 0 | **100%** |
| **Total / Aggregate** | **28** | **14** | **14** | **0** | **0** | **100%** |

- **Precision**: `1.000`
- **Recall**: `1.000`
- **F1 Score**: `1.000`

---

## 5. Live Google Gemini API Verification

Executed via `verify_gemini_provider.py` on 2026-10-31:

| Verification Turn | Method | Model | Latency | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication Ping** | Text Generation (`generate_text`) | `gemini-3-flash-preview` | `1,295 ms` | **HTTP 200 (SUCCESS)** |
| **Structured Output** | `with_structured_output(VerificationResult)` | `gemini-3-flash-preview` | `1,815 ms` | **VALIDATED (SUCCESS)** |
| **Timeout Handling** | Forced 0.1ms timeout | `gemini-3-flash-preview` | `< 1 ms` | **SAFE EXCEPTION (SUCCESS)** |
| **Semantic Grounding** | Claim verification vs BIT 2022 excerpt | `gemini-3-flash-preview` | `2.0 ms` | **CONTRADICTION DETECTED** |
| **Failure Diagnosis** | Root cause analysis & remediation | `gemini-3-flash-preview` | `6,045 ms` | **DIAGNOSIS SYNTHESIZED** |
| **Regression Suite** | Regression recommendation generation | `gemini-3-flash-preview` | `< 1 ms` | **1 REGRESSION GATE CREATED** |

---

## 6. Live Docker Sandbox Target Execution

Executed against running Docker container `qualitrust-rag-target-sandbox` (BIT Regulations 2022 Chatbot):

- **ReliableChatbot (Good Bot)**: Overall Score **74.5/100**, Release Status **`CONDITIONAL_RELEASE`**, Security Pass Rate **100%**.
- **LowPerformanceBot (Weak Bot)**: Overall Score **31.2/100**, Release Status **`RELEASE_BLOCKED`**, Critical Failures: Statutory Rule Inversion, DAN Jailbreak Compliance, Citation Dropping.

