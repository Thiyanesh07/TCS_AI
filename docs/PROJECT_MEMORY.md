# QualiTrust AI — Project Memory

## Project Overview
QualiTrust AI evaluates AI-enabled applications (submitted via source archive or API endpoint) through risk discovery, dynamic test generation, multi-dimensional evaluation (accuracy, grounding, security, safety, consistency, completeness, citation quality), evidence collection, quality scoring, and release recommendation.

## Engineering Team Roles
- Developer 1: Frontend (React, TypeScript, Vite, Tailwind CSS, TanStack Query)
- Developer 2: Backend (FastAPI, SQLAlchemy, Alembic, PostgreSQL, Docker worker)
- Developer 3 (Current): AI Engine (LangChain, LangGraph, Microsoft PyRIT, Ragas, Deterministic Evaluators, OpenTelemetry)

## Key Technical Decisions
- Unified data model in `shared/schemas/contracts.py` ensuring zero divergence across Frontend, Backend, and AI Engine.
- AI Engine packaged as a callable Python module (`run_ai_evaluation(input: AIEngineInput) -> AIEngineOutput`), not an isolated uncoordinated microservice.
- Deterministic scoring (`likelihood * impact`) and claim-level grounding verification.
- Telemetry instrumentation using OpenTelemetry spans without leaking confidential code or prompts.
- Docker Sandbox Execution: Verified Docker Desktop 28.5.1 with unprivileged container execution (UID 10001), 1.0 CPU, 1024 MB RAM, and 100 PIDs limit.
- Real RAG Application Evaluation: Demonstrated end-to-end evaluation of `bot 1.zip` (College Regulations RAG application) with dual baseline comparison, claim-level grounding verification, and Microsoft PyRIT adversarial injections.


