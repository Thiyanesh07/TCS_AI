# QualiTrust AI — AI Engine Setup & Operations Guide
**Document ID**: `QUALITRUST-OPS-SETUP-01`  
**Date**: 2026-10-31  
**Target Environment**: Python 3.11+ / Conda `qualitrust-ai`  

---

## 1. Environment & Prerequisites

The AI Engine requires **Python 3.11** with C/C++ build tools for PyMuPDF and Pydantic compilation.

### Recommended Environment: Conda
```powershell
# Create or activate the verified environment
conda activate qualitrust-ai

# Or create from Python 3.11
conda create -n qualitrust-ai python=3.11 -y
conda activate qualitrust-ai
```

---

## 2. Dependency Installation

The core dependencies include LangGraph, Google Gemini GenAI integration, Microsoft PyRIT, and Ragas:

```powershell
pip install -r requirements.txt
```

### Critical Dependency Manifest
- `langchain_google_genai>=4.4.0` (Verified on **v4.4.2**)
- `langgraph>=1.2.0`
- `pydantic>=2.7.0` (Verified on **v2.14.1**)
- `pyrit>=1.1.0` (Microsoft PyRIT adversarial engine)
- `ragas>=0.4.0` (Verified on **v0.4.3**)
- `httpx>=0.27.0`
- `pytest>=8.0.0`
- `opentelemetry-api>=1.20.0`

---

## 3. Environment Variable Configuration

Create a local `.env` file in the project root:

```ini
# Primary Evaluator LLM Configuration (Mandatory)
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_TIMEOUT_SECONDS=30.0

# Optional OpenTelemetry Configuration
OTEL_SERVICE_NAME=qualitrust-ai-engine
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Docker Sandbox Configuration
DOCKER_SANDBOX_TIMEOUT_SECONDS=30.0
```

> [!CAUTION]
> Never commit `.env` to Git. Verify that `.gitignore` contains `.env` before any commit.

---

## 4. Operational Verification Commands

### 4.1 Run AI Engine Pytest Suite
```powershell
pytest ai_engine/tests
```
*Expected: 30 passed in ~12 seconds.*

### 4.2 Verify Google Gemini Live API Integration
```powershell
python verify_gemini_provider.py
```
*Expected: All 6 stages return VERIFIED; tests minimal call, structured output, and failure diagnosis.*

### 4.3 Verify Target Docker Sandbox
```powershell
# Check Docker daemon availability
docker info

# Build and launch sandbox container
docker build -t qualitrust-rag-target:v1 "sandbox_staging/rag_target/low performance bot"
docker run -d --name qualitrust-rag-target-sandbox -p 8000:8000 --cpus=1.0 --memory=1024m --pids-limit=100 qualitrust-rag-target:v1

# Test sandbox connectivity
python run_rag_sandbox_evaluation.py
```

---

## 5. Directory Structure Overview

```text
├── ai_engine/
│   ├── adapters/          # API, Mock, PyRIT, Ragas, and Docker Sandbox target adapters
│   ├── agents/            # Five specialized logical AI agents
│   ├── evaluators/        # Deterministic, Claim Grounding, Quality, Security evaluators
│   ├── graphs/            # 15-stage LangGraph StateGraph orchestrator
│   ├── providers/         # Multi-provider abstraction & Google Gemini provider
│   ├── schemas/           # Internal engine schemas (profile, evaluators)
│   ├── telemetry/         # OpenTelemetry distributed tracing wrapper
│   └── tests/             # 30-item pytest test suite & synthetic benchmark
├── shared/
│   └── schemas/
│       └── contracts.py   # Canonical shared Pydantic data contracts
├── docs/                  # Architecture, contracts, audit, and setup documentation
├── sandbox_staging/       # Ephemeral isolated extraction staging for untrusted archives
└── sandbox-testing-results/ # Real evaluation reports and evidence artifacts
```

