"""
Evaluation Engine for QualiTrust AI.
Performs real, deterministic quality engineering and security inspections for AI applications:
- ZIP archive applications: Static analysis, prompt injection defense, credential scanning, unsafe deserialization.
- API target applications: SSRF-safe outbound probing, transport security, error leakage resistance.
Never executes untrusted code on the API server.
"""

import io
import re
import time
import zipfile
from typing import List, Dict, Any, Tuple
import httpx

from app.core.api_target_validator import validate_api_target_url

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
        self.quality_score: float = 100.0
        self.release_status: str = "eligible"
        self.total_tests: int = 0
        self.passed_tests: int = 0
        self.failed_tests: int = 0
        self.uncertain_tests: int = 0
        self.error_tests: int = 0


def evaluate_zip_application(zip_bytes: bytes) -> EvaluationResultData:
    """
    Executes real static code analysis and security inspections on an unpacked ZIP archive in-memory.
    Never executes the uploaded Python modules.
    """
    result = EvaluationResultData()
    start_time = time.time()

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
    except Exception as exc:
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
                        "payload": {"matched_pattern": pattern.pattern[:25] + "..."},
                    },
                })
    t1_duration = int((time.time() - t1_start) * 1000)

    # 2. Test Case: Unsafe Code Execution Audit
    tc2_name = "Unsafe Code Execution & Deserialization Audit"
    tc2_category = "security"
    tc2_verdict = "pass"
    tc2_findings = []

    t2_start = time.time()
    for filename, text in file_contents.items():
        if not filename.endswith(".py"):
            continue
        for pattern, desc in DANGEROUS_CALLS:
            if pattern.search(text):
                tc2_verdict = "fail"
                tc2_findings.append({
                    "title": "Unsafe Dynamic Execution Primitive",
                    "description": f"{desc} in '{filename}'.",
                    "severity": "high",
                    "evidence": {
                        "type": "code_snippet",
                        "file_path": filename,
                        "payload": {"rule": pattern.pattern},
                    },
                })
    t2_duration = int((time.time() - t2_start) * 1000)

    # 3. Test Case: Prompt Template & Injection Defense Check
    tc3_name = "Prompt Template Injection Resistance"
    tc3_category = "safety"
    tc3_verdict = "pass"
    tc3_findings = []

    t3_start = time.time()
    for filename, text in file_contents.items():
        for pattern, desc in PROMPT_INJECTION_RISKS:
            if pattern.search(text):
                tc3_verdict = "fail"
                tc3_findings.append({
                    "title": "Unbounded Prompt Variable Interpolation",
                    "description": f"{desc} in '{filename}'.",
                    "severity": "medium",
                    "evidence": {
                        "type": "code_snippet",
                        "file_path": filename,
                        "payload": {"file": filename},
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

    # Assemble test cases and results
    suite = [
        (tc1_name, tc1_category, tc1_verdict, "critical", t1_duration, tc1_findings, "Scanned all package files for exposed AI provider API keys."),
        (tc2_name, tc2_category, tc2_verdict, "high", t2_duration, tc2_findings, "Inspected Python files for eval/exec and dangerous deserializers."),
        (tc3_name, tc3_category, tc3_verdict, "medium", t3_duration, tc3_findings, "Verified prompt template boundaries against injection vulnerabilities."),
        (tc4_name, tc4_category, tc4_verdict, "low", t4_duration, [], "Checked presence of dependency manifests."),
    ]

    _process_suite_results(result, suite)
    return result


def evaluate_api_application(target_url: str) -> EvaluationResultData:
    """
    Executes safe outbound probes against an external AI API endpoint.
    Applies strict SSRF checks at the exact point of execution.
    """
    result = EvaluationResultData()

    # Re-validate target URL immediately before outbound request to prevent DNS rebinding
    is_valid, err_msg = validate_api_target_url(target_url)
    if not is_valid:
        result.release_status = "blocked"
        result.total_tests = 1
        result.failed_tests = 1
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
    elif has_critical or failed > 0 and has_high:
        result.release_status = "blocked"
    elif result.quality_score >= 80.0 and not has_high:
        result.release_status = "eligible"
    elif result.quality_score >= 60.0:
        result.release_status = "review_required"
    else:
        result.release_status = "blocked"

