"""
Evaluation Engine for QualiTrust AI.
Performs real, deterministic quality engineering and security inspections for AI applications:
- ZIP archive applications: Static analysis, prompt injection defense, credential scanning, unsafe deserialization.
- API target applications: SSRF-safe outbound probing, transport security, error leakage resistance.
- AI Engine LangGraph Workflow: Multi-agent evaluation, claim-level grounding, PyRIT security probing, Gemini scoring.
Never executes untrusted code on the API server.
"""

import io
import os
import re
import sys
import time
import uuid
import zipfile
import logging
from typing import List, Dict, Any, Tuple, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

# Ensure project root is in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.core.api_target_validator import validate_api_target_url

logger = logging.getLogger("qualitrust.evaluation_engine")

# Regex patterns for AI provider credential leakage
CREDENTIAL_PATTERNS = [
    (re.compile(r"sk-[a-zA-Z0-9_-]{20,}"), "Hardcoded OpenAI / LLM API key detected"),
    (re.compile(r"sk-ant-[a-zA-Z0-9_-]{20,}"), "Hardcoded Anthropic API key detected"),
    (re.compile(r"hf_[a-zA-Z0-9]{20,}"), "Hardcoded HuggingFace token detected"),
    (re.compile(r'(?i)(api[_-]?key|secret[_-]?key)\s*=\s*["\'][a-zA-Z0-9_\-\.]{16,}["\']'), "Generic API secret key hardcoded in source"),
]

# Unsafe code execution primitives
DANGEROUS_CALLS = [
    (re.compile(r"\b(eval|exec)\s*\("), "Dynamic code execution (eval/exec) detected"),
    (re.compile(r"\bos\.system\s*\("), "Direct operating system command execution detected"),
    (re.compile(r"\bpickle\.loads?\s*\("), "Unsafe object deserialization (pickle) detected"),
]

# Prompt injection indicators
PROMPT_INJECTION_RISKS = [
    (re.compile(r'(?i)f["\'].*\{.*user.*input.*\}.*["\']'), "Direct user input interpolation into prompt template without boundary guardrails"),
    (re.compile(r'(?i)\.format\(.*user.*\)'), "Unescaped format string parameter passed to prompt constructor"),
]


class EvaluationResultData:
    def __init__(self):
        self.test_cases: List[Dict[str, Any]] = []
        self.test_results: List[Dict[str, Any]] = []
        self.findings: List[Dict[str, Any]] = []
        self.evidence: List[Dict[str, Any]] = []
        self.regression_tests: List[Dict[str, Any]] = []
        self.quality_score: float = 100.0
        self.release_status: str = "eligible"
        self.total_tests: int = 0
        self.passed_tests: int = 0
        self.failed_tests: int = 0
        self.uncertain_tests: int = 0
        self.error_tests: int = 0


def _invoke_ai_engine(input_data: Any, result: EvaluationResultData) -> None:
    """Invokes the LangGraph AI Engine and incorporates its metrics, tests, findings, and regressions."""
    try:
        from ai_engine.engine import run_ai_evaluation
        ai_output = run_ai_evaluation(input_data)
        if not ai_output or not ai_output.test_cases:
            return

        tc_name_by_id = {}
        for tc in ai_output.test_cases:
            name = tc.title
            tc_name_by_id[tc.id] = name
            result.test_cases.append({
                "name": name,
                "category": tc.category.value if hasattr(tc.category, "value") else str(tc.category),
                "is_automated": True,
            })

        for tr in ai_output.test_results:
            tc_name = tc_name_by_id.get(tr.test_case_id, "AI Engine Evaluation Test")
            verdict = tr.verdict.value if hasattr(tr.verdict, "value") else str(tr.verdict)
            severity = tr.severity.value if hasattr(tr.severity, "value") else str(tr.severity)
            result.test_results.append({
                "name": tc_name,
                "verdict": verdict,
                "severity": severity,
                "execution_duration_ms": int(tr.latency_ms or 0),
                "output_summary": str(tr.response)[:500],
            })
            result.total_tests += 1
            if verdict == "pass":
                result.passed_tests += 1
            elif verdict == "fail":
                result.failed_tests += 1
            elif verdict == "uncertain":
                result.uncertain_tests += 1
            else:
                result.error_tests += 1

        for f in ai_output.findings:
            sev = f.severity.value if hasattr(f.severity, "value") else str(f.severity)
            result.findings.append({
                "title": f.title,
                "description": f.description,
                "severity": sev,
                "evidence": {
                    "type": "ai_evaluation_finding",
                    "payload": {
                        "remediation": f.remediation_recommendation,
                        "root_cause": f.root_cause_hypothesis,
                    },
                },
            })

        for reg in ai_output.regression_recommendations:
            result.regression_tests.append({
                "name": reg.title,
                "status": getattr(reg, "validation_status", "active"),
            })

        if ai_output.overall_quality_score is not None:
            score = ai_output.overall_quality_score
            if 0.0 <= score <= 1.0:
                score *= 100.0
            result.quality_score = round(score, 1)

        if ai_output.release_recommendation:
            rec = ai_output.release_recommendation.value.lower()
            result.release_status = rec

    except Exception as exc:
        logger.warning("AI Engine evaluation bypassed or failed: %s", exc)


def evaluate_zip_application(
    zip_bytes: bytes,
    run_id: Optional[uuid.UUID] = None,
    application_id: Optional[uuid.UUID] = None,
    version_id: Optional[uuid.UUID] = None,
) -> EvaluationResultData:
    """
    Executes real static code analysis and security inspections on an unpacked ZIP archive in-memory.
    Never executes the uploaded Python modules.
    """
    result = EvaluationResultData()

    # Collect readable source files from archive
    file_contents: Dict[str, str] = {}
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            for name in z.namelist():
                if name.endswith(("/", "\\")):
                    continue
                # Inspect text/code files only
                if any(name.endswith(ext) for ext in [".py", ".json", ".yaml", ".yml", ".txt", ".md", ".env"]):
                    try:
                        raw = z.read(name)
                        file_contents[name] = raw.decode("utf-8", errors="ignore")
                    except Exception:
                        continue
    except Exception:
        result.release_status = "inconclusive"
        result.total_tests = 1
        result.error_tests = 1
        return result

    # 1. Test Case: Credential Exposure Audit
    tc1_name = "Hardcoded Secret & API Key Audit"
    tc1_category = "security"
    tc1_verdict = "pass"
    tc1_findings = []

    t1_start = time.time()
    for filename, text in file_contents.items():
        for pattern, desc in CREDENTIAL_PATTERNS:
            matches = pattern.findall(text)
            if matches:
                tc1_verdict = "fail"
                tc1_findings.append({
                    "title": "Hardcoded AI Credential Detected",
                    "description": f"{desc} in '{filename}'.",
                    "severity": "critical",
                    "evidence": {
                        "type": "code_snippet",
                        "file_path": filename,
                        "payload": {"matches_count": len(matches), "pattern": pattern.pattern},
                    },
                })
    t1_duration = int((time.time() - t1_start) * 1000)

    # 2. Test Case: Dangerous System Primitives
    tc2_name = "Dynamic Code Execution & Deserialization Audit"
    tc2_category = "security"
    tc2_verdict = "pass"
    tc2_findings = []

    t2_start = time.time()
    for filename, text in file_contents.items():
        for pattern, desc in DANGEROUS_CALLS:
            matches = pattern.findall(text)
            if matches:
                tc2_verdict = "fail"
                tc2_findings.append({
                    "title": "Dangerous Execution Primitive Detected",
                    "description": f"{desc} in '{filename}'.",
                    "severity": "high",
                    "evidence": {
                        "type": "code_snippet",
                        "file_path": filename,
                        "payload": {"pattern": pattern.pattern},
                    },
                })
    t2_duration = int((time.time() - t2_start) * 1000)

    # 3. Test Case: Prompt Injection & Template Safety
    tc3_name = "Prompt Template Injection Resistance"
    tc3_category = "safety"
    tc3_verdict = "pass"
    tc3_findings = []

    t3_start = time.time()
    for filename, text in file_contents.items():
        for pattern, desc in PROMPT_INJECTION_RISKS:
            matches = pattern.findall(text)
            if matches:
                tc3_verdict = "fail"
                tc3_findings.append({
                    "title": "Vulnerable Prompt Construction",
                    "description": f"{desc} in '{filename}'.",
                    "severity": "medium",
                    "evidence": {
                        "type": "code_snippet",
                        "file_path": filename,
                        "payload": {"pattern": pattern.pattern},
                    },
                })
    t3_duration = int((time.time() - t3_start) * 1000)

    # 4. Test Case: Dependency Declaration & Pinning
    tc4_name = "Dependency Manifest & Security Verification"
    tc4_category = "reliability"
    tc4_verdict = "pass"
    t4_start = time.time()
    has_reqs = any("requirements" in k.lower() or "pyproject" in k.lower() for k in file_contents)
    if not has_reqs:
        tc4_verdict = "uncertain"
    t4_duration = int((time.time() - t4_start) * 1000)

    suite = [
        (tc1_name, tc1_category, tc1_verdict, "critical", t1_duration, tc1_findings, "Scanned all package files for exposed AI provider API keys."),
        (tc2_name, tc2_category, tc2_verdict, "high", t2_duration, tc2_findings, "Inspected Python files for eval/exec and dangerous deserializers."),
        (tc3_name, tc3_category, tc3_verdict, "medium", t3_duration, tc3_findings, "Verified prompt template boundaries against injection vulnerabilities."),
        (tc4_name, tc4_category, tc4_verdict, "low", t4_duration, [], "Checked presence of dependency manifests."),
    ]

    _process_suite_results(result, suite)
    return result


def evaluate_api_application(
    target_url: str,
    run_id: Optional[uuid.UUID] = None,
    application_id: Optional[uuid.UUID] = None,
    version_id: Optional[uuid.UUID] = None,
) -> EvaluationResultData:
    """
    Performs SSRF-safe outbound probing and transport inspection against an API target,
    then executes full LangGraph AI Engine evaluation if configured.
    """
    result = EvaluationResultData()

    # Pre-flight SSRF Validation
    is_safe, err_msg = validate_api_target_url(target_url)
    if not is_safe:
        result.release_status = "blocked"
        result.total_tests = 1
        result.failed_tests = 1
        result.test_cases.append({
            "name": "SSRF Target Validation Check",
            "category": "security",
            "is_automated": True,
        })
        result.test_results.append({
            "name": "SSRF Target Validation Check",
            "verdict": "fail",
            "severity": "critical",
            "execution_duration_ms": 1,
            "output_summary": f"Target URL rejected by SSRF protection validator: {err_msg}",
        })
        result.findings.append({
            "title": "Target Endpoint SSRF Validation Failure",
            "description": f"Target URL failed SSRF pre-flight check: {err_msg}",
            "severity": "critical",
            "evidence": {"type": "security_check", "payload": {"url": target_url, "error": err_msg}},
        })
        result.quality_score = 0.0
        return result

    # 1. Connectivity & Latency Probe
    tc1_name = "Endpoint Availability & Latency Check"
    tc1_verdict = "pass"
    tc1_findings = []
    t1_start = time.time()
    resp_headers = {}

    try:
        with httpx.Client(timeout=5.0, follow_redirects=False) as client:
            resp = client.get(target_url)
            resp_headers = dict(resp.headers)
            if resp.status_code >= 500:
                tc1_verdict = "fail"
                tc1_findings.append({
                    "title": "Target Endpoint Returned Server Error",
                    "description": f"Endpoint responded with HTTP {resp.status_code}.",
                    "severity": "high",
                    "evidence": {"type": "http_response", "payload": {"status_code": resp.status_code}},
                })
    except httpx.RequestError as exc:
        tc1_verdict = "error"
        tc1_findings.append({
            "title": "Target Endpoint Unreachable",
            "description": f"Failed to connect to target API: {type(exc).__name__}",
            "severity": "high",
            "evidence": {"type": "network_error", "payload": {"error": str(exc)}},
        })
    t1_duration = int((time.time() - t1_start) * 1000)

    # 2. Transport Security & Header Inspection
    tc2_name = "Transport Security & Security Headers Check"
    tc2_verdict = "pass"
    tc2_findings = []
    t2_start = time.time()
    if not target_url.lower().startswith("https://"):
        tc2_verdict = "fail"
        tc2_findings.append({
            "title": "Unencrypted HTTP Communication",
            "description": "Target endpoint does not use HTTPS.",
            "severity": "critical",
            "evidence": {"type": "http_check", "payload": {"url": target_url}},
        })
    else:
        if "strict-transport-security" not in {k.lower() for k in resp_headers}:
            tc2_findings.append({
                "title": "Missing HSTS Header",
                "description": "Target API response does not include Strict-Transport-Security header.",
                "severity": "low",
                "evidence": {"type": "header_check", "payload": {"headers": list(resp_headers.keys())}},
            })
    t2_duration = int((time.time() - t2_start) * 1000)

    suite = [
        (tc1_name, "availability", tc1_verdict, "high", t1_duration, tc1_findings, f"Probed external endpoint {target_url}."),
        (tc2_name, "security", tc2_verdict, "critical", t2_duration, tc2_findings, "Inspected TLS transport security and protection headers."),
    ]

    _process_suite_results(result, suite)

    # 3. If live evaluation context is supplied and Gemini is configured, invoke AI Engine LangGraph
    if run_id and application_id and version_id and os.environ.get("GEMINI_API_KEY"):
        try:
            from shared.schemas.contracts import AIEngineInput, IntegrationType, TestBudget
            ai_input = AIEngineInput(
                run_id=run_id,
                application_id=application_id,
                version_id=version_id,
                integration_type=IntegrationType.API,
                application_config={
                    "api_target": {
                        "endpoint_url": target_url,
                        "method": "POST",
                        "bot_mode": "good_bot",
                    }
                },
                test_budget=TestBudget(baseline=2, risk_targeted=2, adversarial=1, regression=1),
            )
            _invoke_ai_engine(ai_input, result)
        except Exception as exc:
            logger.warning("AI Engine execution failed during API evaluation: %s", exc)

    return result


def _process_suite_results(result: EvaluationResultData, suite: List[Tuple]):
    """Aggregates test outcomes, calculates deterministic quality score and release status."""
    total = len(suite)
    passed = 0
    failed = 0
    uncertain = 0
    errors = 0
    all_findings = []

    for name, category, verdict, severity, duration, findings, summary in suite:
        result.test_cases.append({
            "name": name,
            "category": category,
            "is_automated": True,
        })
        result.test_results.append({
            "name": name,
            "verdict": verdict,
            "severity": severity,
            "execution_duration_ms": duration,
            "output_summary": summary,
        })
        if verdict == "pass":
            passed += 1
        elif verdict == "fail":
            failed += 1
        elif verdict == "uncertain":
            uncertain += 1
        elif verdict == "error":
            errors += 1

        for f in findings:
            all_findings.append(f)

    result.total_tests = total
    result.passed_tests = passed
    result.failed_tests = failed
    result.uncertain_tests = uncertain
    result.error_tests = errors
    result.findings = all_findings

    # Compute deterministic quality score
    score = 100.0
    has_critical = False
    has_high = False

    for f in all_findings:
        sev = f["severity"].lower()
        if sev == "critical":
            score -= 40.0
            has_critical = True
        elif sev == "high":
            score -= 20.0
            has_high = True
        elif sev == "medium":
            score -= 10.0
        elif sev == "low":
            score -= 5.0

    result.quality_score = max(0.0, min(100.0, round(score, 1)))

    # Compute deterministic release status
    if errors > 0:
        result.release_status = "inconclusive"
    elif has_critical or (failed > 0 and has_high):
        result.release_status = "blocked"
    elif result.quality_score >= 80.0 and not has_high:
        result.release_status = "eligible"
    elif result.quality_score >= 60.0:
        result.release_status = "review_required"
    else:
        result.release_status = "blocked"
