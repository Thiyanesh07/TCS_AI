# QualiTrust AI — RAG Integration Gaps & Platform Compatibility Report
**Document ID**: `QUALITRUST-RAG-GAPS-2022-01`  
**Date**: 2026-10-31  
**Author**: Principal AI Platform Architect & Sandbox Engineer  

---

## 1. Executive Summary

This report documents architectural and operational gaps identified during the end-to-end evaluation of the College Regulations Chatbot (`bot 1.zip`) inside the QualiTrust AI Docker sandbox. It highlights differences between the platform's standard evaluation contracts and the target application's exposed interfaces, detailing workarounds applied and recommendations for production readiness.

---

## 2. Gaps in the Target RAG Application

| Gap ID | Component | Expected by Platform | Observed in Target Application | Resolution / Workaround |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-APP-01** | **Interface / Protocol** | REST API with `/health` and structured execution endpoints | Interactive Streamlit UI (`app.py`) only; no native HTTP JSON API server | Implemented `server.py` in the container sandbox exposing `/health`, `/chat`, and `/sandbox/execute`. |
| **GAP-APP-02** | **Container Packaging** | Standard `Dockerfile` with unprivileged user & healthcheck | Missing `Dockerfile` in the ZIP archive | Generated production-grade `Dockerfile` using `python:3.11-slim`, non-root user `appuser` (UID 10001), and resource limits. |
| **GAP-APP-03** | **Retrieved Context Format**| Formatted context string or string list | In target schemas, retrieved chunks were nested Pydantic objects (`RetrievedChunk`) | Serialized chunk text into concatenated strings compatible with `TargetResponse.retrieved_context`. |
| **GAP-APP-04** | **Citation Serialization**| List of string citations or standardized citation objects | Pydantic `Citation` models with internal metadata | Serialized citations via `model_dump_json()` or string representations. |

---

## 3. Adaptations Made to QualiTrust AI Engine

1. **`SandboxTargetAdapter` Schema Defensiveness**:
   - *Observation*: `TargetResponse` expects `retrieved_context` as `Optional[str]`. When an external service returns a list of context strings (`List[str]`), Pydantic validation failed and triggered fallback simulation.
   - *Adaptation*: Enhanced `SandboxTargetAdapter.execute()` to automatically join list-based retrieved contexts (`"\n\n".join(ctx_raw)`) and ensure string citation lists.
2. **Ragas 0.4.3 Compatibility Shim**:
   - *Observation*: `ragas 0.4.3` in the Python 3.11 environment attempted to import `ChatVertexAI` from `langchain_community.chat_models.vertexai` which was relocated in LangChain 1.4+.
   - *Adaptation*: Added a safe compatibility shim in `ai_engine/adapters/ragas_adapter.py` that mocks the deprecated import path, allowing `ragas` to load and run without crashing.
3. **Pytest Schema Collision Prevention**:
   - *Observation*: Classes starting with `Test` (`TestCase`, `TestResult`, `TestCategory`) caused pytest to attempt test collection on Pydantic models.
   - *Adaptation*: Set `__test__ = False` on canonical schemas in `shared/schemas/contracts.py`.

---

## 4. Recommendations to Improve RAG Application Evaluability

1. **Standardized AI Application Manifest (`qualitrust.yaml`)**:
   Target applications should include a lightweight manifest specifying:
   ```yaml
   name: "college-regulations-rag"
   version: "1.0.0"
   entrypoint: "src.chatbot_good:ReliableChatbot"
   api:
     port: 8000
     chat_endpoint: "/chat"
     health_endpoint: "/health"
   documents:
     path: "data/Level 1 Materials.pdf"
     type: "pdf"
   ```
2. **Native Telemetry Header Forwarding**:
   RAG targets should return `X-Retrieval-Latency-Ms`, `X-Retrieved-Chunks-Count`, and `X-Claim-Validation-Status` in HTTP response headers to enable zero-overhead observability.
3. **Structured Claim Attribution**:
   Chatbots should provide clear clause-level attribution in their JSON responses to streamline automated claim-verification and Ragas faithfulness scoring.

