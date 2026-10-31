/**
 * QualiTrust AI — Evaluation Domain Types
 *
 * Types for evaluation configuration, multi-stage async progress tracking,
 * 9-dimension quality scores, findings evidence, and release recommendations.
 */

export type EvaluationScope =
  | "FULL_SUITE"
  | "SAFETY_REDTEAM"
  | "GROUNDING_BENCHMARK"
  | "CUSTOM";

export type EvaluationStatus =
  | "PENDING"
  | "INITIALIZING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ReleaseRecommendation =
  | "RELEASE"
  | "CONDITIONAL_RELEASE"
  | "REJECT";

export interface EvaluationStage {
  id: string;
  name: string;
  status: "pending" | "active" | "completed" | "failed";
  durationSeconds?: number;
  message?: string;
}

export interface QualityDimensions {
  accuracy: number;
  grounding: number;
  completeness: number;
  safety: number;
  security: number;
  consistency: number;
  bias: number;
  modelDrift: number;
  releaseReadiness: number;
}

export interface TestExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
}

export interface FindingsSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface EvaluationFinding {
  id: string;
  pillar: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  promptExcerpt?: string;
  responseExcerpt?: string;
  groundTruthDiscrepancy?: string;
  remediation?: string;
}

export interface EvaluationRunDetail {
  id: string;
  runNumber: string;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  environment: string;
  status: EvaluationStatus;
  scope: EvaluationScope;
  startedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  overallScore?: number;
  recommendation?: ReleaseRecommendation;
  recommendationExplanation?: string;
  blockersCount: number;
  warningsCount: number;
  stages: EvaluationStage[];
  dimensions?: QualityDimensions;
  testExecution?: TestExecutionSummary;
  findingsBreakdown?: FindingsSeverityBreakdown;
  findings: EvaluationFinding[];
  executionLogs: string[];
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

export interface StartEvaluationPayload {
  applicationId: string;
  version: string;
  environment: string;
  scope: EvaluationScope;
  selectedSuiteIds?: string[];
  concurrency?: number;
  maxTimeoutMinutes?: number;
}

