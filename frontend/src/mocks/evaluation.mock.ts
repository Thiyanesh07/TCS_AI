/**
 * QualiTrust AI — Development Evaluation Mock Fixtures
 *
 * STATUS: DEVELOPMENT_MOCK_ONLY
 * Used strictly as fallback fixtures while backend API contracts are pending.
 */

import { EvaluationRunDetail, EvaluationStage } from "@/types/evaluation.types";

export const EVALUATION_STAGES_TEMPLATE: EvaluationStage[] = [
  { id: "stage_1", name: "Application Inspection & Schema Validation", status: "completed", durationSeconds: 4 },
  { id: "stage_2", name: "Risk Surface Analysis & Threat Modeling", status: "completed", durationSeconds: 8 },
  { id: "stage_3", name: "Dynamic Test Generation & Golden Set Synthesis", status: "completed", durationSeconds: 15 },
  { id: "stage_4", name: "Sandbox Test Execution (LLM Invocations)", status: "completed", durationSeconds: 42 },
  { id: "stage_5", name: "Response Grounding & Factuality Verification", status: "completed", durationSeconds: 18 },
  { id: "stage_6", name: "Safety, Security & Bias Invariant Checking", status: "completed", durationSeconds: 12 },
  { id: "stage_7", name: "9-Dimension Scoring & Weight Aggregation", status: "completed", durationSeconds: 6 },
  { id: "stage_8", name: "Release Intelligence Gate Synthesis", status: "completed", durationSeconds: 5 },
];

export const MOCK_EVALUATION_RUN_DETAIL: EvaluationRunDetail = {
  id: "run_9841",
  runNumber: "RUN-9841",
  applicationId: "app_rag_091",
  applicationName: "FinanceAdvisor RAG Pipeline",
  applicationVersion: "v2.4.1",
  environment: "PRODUCTION",
  status: "COMPLETED",
  scope: "FULL_SUITE",
  startedAt: "2026-10-29T14:00:00Z",
  completedAt: "2026-10-29T14:15:00Z",
  elapsedSeconds: 110,
  overallScore: 94,
  recommendation: "RELEASE",
  recommendationExplanation:
    "All 9 evaluation pillars satisfied threshold bounds. Safety and security invariants achieved 100% adherence. Zero critical blocker defects detected across 665 golden test assertions.",
  blockersCount: 0,
  warningsCount: 1,
  isMock: true,
  dataSource: "DEVELOPMENT_MOCK_ONLY",
  stages: EVALUATION_STAGES_TEMPLATE,
  dimensions: {
    accuracy: 96,
    grounding: 95,
    completeness: 92,
    safety: 99,
    security: 98,
    consistency: 91,
    bias: 97,
    modelDrift: 89,
    releaseReadiness: 94,
  },
  testExecution: {
    total: 665,
    passed: 642,
    failed: 15,
    warnings: 8,
    skipped: 0,
  },
  findingsBreakdown: {
    critical: 0,
    high: 1,
    medium: 3,
    low: 4,
  },
  findings: [
    {
      id: "f_01",
      pillar: "Grounding",
      severity: "HIGH",
      title: "Extrapolated Ratio under Missing Footnote Disclosures",
      description:
        "When SEC 10-Q footnote 14 was omitted in sparse retrieval, the model calculated an ungrounded 22.4x forward multiple.",
      promptExcerpt:
        "Analyze ticker XYZ's Q3 cash flow statement and compute free cash flow conversion ratio. Reference footnote 14 for deferred tax assets.",
      responseExcerpt:
        "Free cash flow conversion is estimated at 84.2% assuming a statutory effective tax rate of 21% based on general industrial benchmarks.",
      groundTruthDiscrepancy:
        "Model guessed 21% tax rate instead of raising a missing citation disclaimer.",
      remediation:
        "Tighten retrieval threshold to refuse computation if Footnote 14 chunk is absent from vector context.",
    },
    {
      id: "f_02",
      pillar: "Consistency",
      severity: "MEDIUM",
      title: "Currency Unit Representation Variance",
      description:
        "Model alternated between '$', 'USD', and 'US Dollars' within the same executive summary table.",
      promptExcerpt:
        "Tabulate EBITDA margins for Q1 through Q4 with corresponding currency units.",
      responseExcerpt:
        "Q1: $14.2M | Q2: 15.1M USD | Q3: 16.0M US Dollars",
      remediation: "Inject deterministic output formatting constraint in system prompt.",
    },
    {
      id: "f_03",
      pillar: "Completeness",
      severity: "LOW",
      title: "Omitted Risk Factor Subclause 4(b)",
      description:
        "Summarization dropped foreign currency exchange rate risk sensitivity subclause.",
      remediation: "Expand output token limit from 1024 to 2048 for full risk itemization.",
    },
  ],
  executionLogs: [
    "[14:00:02] Initialized evaluation worker pod on cluster us-east-1",
    "[14:00:06] Verified source package checksum: sha256:7f9a2b0c3e1d489",
    "[14:00:14] Loaded 665 test cases across 4 golden suites",
    "[14:00:29] Executing sandbox inference batch 1/8 (LLM: GPT-4o / Claude 3.5)",
    "[14:01:05] Grounding verifier evaluated 240 citations; 95.8% exact citation match",
    "[14:01:25] Safety guardrail sweep completed; zero prompt injection bypasses detected",
    "[14:01:42] Aggregated 9-dimension quality matrix: overall score 94 / 100",
    "[14:01:50] Release Gate decision: APPROVED FOR RELEASE",
  ],
};

