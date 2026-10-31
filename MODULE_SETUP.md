# QualiTrust AI — AI Engine Module Setup Guide

**Owner**: AI Engineer  
**Component**: `ai_engine`  
**Target Environment**: Conda (`qualitrust-ai`, Python 3.11.18)

---

## 1. Environment Setup

The AI Engine executes within the dedicated Conda environment:

```powershell
# Activate environment
conda activate qualitrust-ai

# Or invoke directly via absolute Python interpreter
& "C:\Users\Thiya\anaconda3\envs\qualitrust-ai\python.exe" -V
```

### Required Packages
Installed in `qualitrust-ai`:
- `pydantic>=2.14.0`
- `langchain>=1.4.0`
- `langchain-core>=1.7.0`
- `langgraph>=1.2.0`
- `langgraph-checkpoint>=4.3.0`
- `pyrit==1.1.0`
- `ragas==0.4.3`
- `httpx>=0.28.0`
- `opentelemetry-api>=1.45.0`
- `opentelemetry-sdk>=1.45.0`
- `pytest>=9.2.0`

---

## 2. Environment Variables & Configuration

The AI Engine reads configuration from environment variables or `AIEngineInput.application_config`:

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Key for OpenAI models | Optional (falls back to deterministic mock) |
| `ANTHROPIC_API_KEY`| Key for Claude models | Optional (falls back to deterministic mock) |
| `GOOGLE_API_KEY` | Key for Gemini models | Optional (falls back to deterministic mock) |
| `QUALITRUST_SANDBOX_URL` | Endpoint for Docker sandbox runner | `http://127.0.0.1:8080/sandbox/execute` |
| `OTEL_EXPORTER_OTLP_ENDPOINT`| OTLP Collector endpoint | In-memory / console fallback |

---

## 3. How to Run & Verify

### Execute Test Suite (All 30 Tests)
```powershell
& "C:\Users\Thiya\anaconda3\envs\qualitrust-ai\python.exe" -m pytest ai_engine/tests -v
```

### Execute Benchmark Suite (N=28 Cases)
```powershell
& "C:\Users\Thiya\anaconda3\envs\qualitrust-ai\python.exe" -c "from ai_engine.tests.test_benchmark_suite import run_expanded_benchmark_suite; r = run_expanded_benchmark_suite(); print(r.summary())"
```

---

## 4. Backend Worker Integration Example

```python
from uuid import uuid4
from shared.schemas.contracts import AIEngineInput, IntegrationType, TestBudget
from ai_engine.engine import run_ai_evaluation

# 1. Prepare input
input_data = AIEngineInput(
    run_id=uuid4(),
    application_id=uuid4(),
    version_id=uuid4(),
    integration_type=IntegrationType.API,
    application_config={
        "name": "CustomerSupportAgent",
        "domain": "Enterprise Support",
        "api_target": {
            "base_url": "https://api.example.com",
            "endpoint_path": "chat",
            "auth_token": "secret_token_here",
        },
        "knowledge_documents": {
            "Policy REF-01": "Document text here...",
        },
    },
    test_budget=TestBudget(baseline=5, risk_targeted=5, adversarial=3, regression=2),
)

# 2. Run stateful evaluation workflow
output = run_ai_evaluation(input_data)

# 3. Access results
print(f"Status: {output.status}")
print(f"Release Recommendation: {output.release_recommendation}")
print(f"Quality Score: {output.overall_quality_score}")
print(f"Findings: {len(output.findings)}")
print(f"Regression Recommendations: {len(output.regression_recommendations)}")
```

