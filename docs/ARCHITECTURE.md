# QualiTrust AI — System Architecture

## 1. High-Level Overview

QualiTrust AI is an integrated AI Application Quality Engineering and Release Intelligence Platform. It provides an automated, risk-adaptive pipeline for evaluating AI-enabled applications (submitted via source archive or API endpoint), generating dynamic tests, executing evaluations across 7 quality dimensions, collecting cryptographically verifiable evidence, and determining release eligibility.

```text
[Frontend (React/TS)]
        │ HTTP REST /api/v1 (Bearer JWT, X-Request-ID, Idempotency-Key)
        ▼
[FastAPI Backend] ── (Auth, Tenancy, Run Management, Release Policy)
        │
        ▼ (Celery/Redis or Background Worker)
[AI Engine (Python Package)]
        │
        ├── 1. Application Understanding Agent (Profile, Inventory, Hypotheses)
        ├── 2. Risk Intelligence Agent (Taxonomy, Likelihood x Impact, Priority)
        ├── 3. Adaptive Test Planner Agent (Test Budget, Dynamic Suite)
        ├── 4. LangGraph 15-Stage Stateful Orchestration Workflow
        │       ├── Adapters (API, Docker Sandbox, Synthetic Benchmark)
        │       ├── Hybrid Evaluators (Deterministic + Claim Grounding + Ragas + PyRIT)
        ├── 5. Failure Diagnosis Agent (Evidence-backed Root Cause Analysis)
        └── 6. Regression Intelligence Agent (Versioned Reusable Regression Tests)
        │
        ▼ Returns Canonical AIEngineOutput
[PostgreSQL Database] ── (Evaluation Runs, Findings, Test Results, Evidence)
```

## 2. Component Responsibility Boundaries

- **Frontend**: User interface, intake wizard (ZIP/API), dashboards, test case explorer, evidence viewer, release review interface.
- **Backend**: Multi-tenant isolation, user authentication, application registry, job lifecycle, scoring calculation, release policy enforcement.
- **AI Engine**: Static source inspection, risk modeling, test synthesis, LangGraph evaluation orchestration, grounding verification, adversarial attack execution, failure diagnosis, and regression suite management.
- **Sandbox**: Isolated ephemeral container execution for untrusted source packages.

## 3. Evaluation Dimensions

1. **Accuracy**: Correctness of factual statements and adherence to prompt instructions.
2. **Groundedness**: Claim-level verification against provided knowledge documents and citations.
3. **Completeness**: Answer thoroughness and coverage of required user questions.
4. **Consistency**: Semantic and deterministic consistency across multi-turn interactions.
5. **Safety**: Content moderation, toxicity prevention, and policy compliance.
6. **Security & Prompt Injection**: Resistance to direct/indirect prompt injection, jailbreaks, and sensitive data leakage via Microsoft PyRIT.
7. **Citation Quality**: Verification of citation syntax, source document existence, and claim alignment.

