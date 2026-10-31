# QualiTrust AI — Architectural Decision Records (ADRs)

## ADR 001: Integrated Python Package Architecture for AI Engine
- **Context**: The AI Engine needs to execute comprehensive multi-stage evaluations.
- **Decision**: Implemented as a clean, callable Python package (`ai_engine.run_ai_evaluation`) rather than an isolated microservice.
- **Consequences**: Minimizes operational overhead, avoids network hop latency, and simplifies shared data contracts with FastAPI background workers.

## ADR 002: Deterministic Risk Scoring Formula
- **Context**: AI models can produce uncalibrated or shifting risk priority ratings.
- **Decision**: Formula is strictly deterministic: `risk_priority = likelihood * impact` (where likelihood and impact are integers from 1 to 5). Policy overrides enforce mandatory testing for critical security and privacy risks regardless of score rank.

## ADR 003: Claim-Level Grounding Pipeline (8-Stage Hybrid)
- **Context**: Evaluators must verify generated answers against reference knowledge without inventing evidence.
- **Decision**: Deployed an 8-stage pipeline combining deterministic extraction for dates/amounts/IDs and semantic comparison for broad claims. Four explicit verdicts: `supported`, `contradicted`, `unsupported`, `unverifiable`.

## ADR 004: Graceful Degradation for Unobservable Context
- **Context**: Not all target applications expose internal retrieved chunks in API responses.
- **Decision**: Target application response context is explicitly classified as observable or unobservable. Missing retrieval context falls back to claim-level knowledge base grounding and marks Ragas context-dependent metrics as unobservable rather than failing execution.

## ADR 005: Microsoft PyRIT Adversarial Adapter
- **Context**: Authorized adversarial security and prompt injection testing.
- **Decision**: Wrapped through `PyRITAdversarialAdapter`, capturing attack payloads and target response signatures as cryptographic evidence, mapped to canonical `TestResult` and `Finding` structures.

