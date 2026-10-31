/**
 * QualiTrust AI — Findings & Evidence Domain Types
 */

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type FindingStatus = "OPEN" | "MITIGATED" | "RESOLVED" | "SUPPRESSED";

export interface EvidenceRecord {
  promptInput: string;
  modelOutput: string;
  expectedOutput: string;
  discrepancyAnalysis: string;
  sourceCitations?: string[];
  executionTimestamp: string;
  latencyMs?: number;
  tokensUsed?: number;
}

export interface DetailedFinding {
  id: string;
  title: string;
  pillar: "Accuracy" | "Grounding" | "Completeness" | "Safety" | "Security" | "Consistency" | "Bias" | "Model Drift";
  severity: FindingSeverity;
  status: FindingStatus;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  runId: string;
  runNumber: string;
  description: string;
  affectedComponent: string;
  detectedAt: string;
  evidence: EvidenceRecord;
  remediationGuidance: string;
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

export interface QualityReportSummary {
  reportId: string;
  runId: string;
  runNumber: string;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  environment: string;
  generatedAt: string;
  overallScore: number;
  releaseRecommendation: "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";
  recommendationExplanation: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningsCount: number;
  blockersCount: number;
  dimensions: {
    accuracy: number;
    grounding: number;
    completeness: number;
    safety: number;
    security: number;
    consistency: number;
    bias: number;
    modelDrift: number;
    releaseReadiness: number;
  };
  findingsSeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  historicalDelta?: {
    scoreDelta: number;
    regressedPillars: string[];
    improvedPillars: string[];
  };
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

