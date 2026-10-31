/**
 * QualiTrust AI — Release Reviews & Governance Types
 */

export type ReleaseDecision = "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";

export type ReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export interface ReleaseReviewRecord {
  id: string;
  runId: string;
  runNumber: string;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  environment: string;
  decision: ReleaseDecision;
  status: ReviewStatus;
  reviewer?: string;
  reviewerRole?: "PLATFORM_ADMIN" | "ORG_USER";
  comments?: string;
  blockersCount: number;
  warningsCount: number;
  overallScore: number;
  createdAt: string;
  reviewedAt?: string;
  decisionExplanation: string;
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

export interface ReviewSubmissionPayload {
  reviewId: string;
  decision: ReleaseDecision;
  comments: string;
}

export interface RegressionBenchmark {
  id: string;
  testName: string;
  applicationId: string;
  applicationName: string;
  sourceFindingId: string;
  pillar: string;
  baselineScore: number;
  currentScore: number;
  delta: number;
  status: "PASSING" | "FAILING";
  classification: "NEW_DEFECT" | "RESOLVED" | "PERSISTENT";
  lastVerifiedAt: string;
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

