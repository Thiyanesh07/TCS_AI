/**
 * QualiTrust AI — Application Types & Interfaces
 *
 * Authoritative types for AI application registration, management,
 * architectural discovery, and evaluation associations.
 */

export type ApplicationRegistrationMethod = "ZIP_UPLOAD" | "API_CONNECT";

export type ApplicationStatus =
  | "PENDING"
  | "ACTIVE"
  | "EVALUATING"
  | "DEPRECATED"
  | "ARCHIVED";

export type ApplicationEnvironment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";

export type ApplicationCategory =
  | "RAG"
  | "AGENT"
  | "CHATBOT"
  | "WORKFLOW"
  | "CLASSIFIER";

export type HttpMethod = "POST" | "GET";

export type AuthType = "NONE" | "BEARER" | "API_KEY" | "CUSTOM_HEADER";

export interface ZipUploadPayload {
  name: string;
  description?: string;
  version: string;
  category: ApplicationCategory;
  environment: ApplicationEnvironment;
  file: File;
}

export interface ApiRegistrationPayload {
  name: string;
  description?: string;
  version: string;
  category: ApplicationCategory;
  environment: ApplicationEnvironment;
  baseUrl: string;
  endpointPath: string;
  httpMethod: HttpMethod;
  authType: AuthType;
  secretToken?: string;
  headerName?: string;
  requestSchema?: string;
  responseSchema?: string;
}

export interface RegisteredApplication {
  id: string;
  name: string;
  description: string;
  method: ApplicationRegistrationMethod;
  status: ApplicationStatus;
  version: string;
  environment: ApplicationEnvironment;
  category: ApplicationCategory;
  createdAt: string;
  updatedAt: string;
  latestScore?: number;
  latestRecommendation?: "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";
  evaluationsCount: number;
  openRisksCount: number;
  apiDetails?: {
    baseUrl: string;
    endpointPath: string;
    httpMethod: HttpMethod;
    authType: AuthType;
    headerName?: string;
    hasSecret: boolean;
  };
  zipDetails?: {
    fileName: string;
    fileSize: number;
    fileSizeBytes: number;
    checksum?: string;
  };
  discoverySummary?: {
    modelDetected?: string;
    framework?: string;
    vectorStore?: string;
    endpointsCount: number;
    status: "PENDING" | "COMPLETED" | "FAILED";
  };
  isMock?: boolean;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

export interface ApplicationFilterParams {
  search?: string;
  category?: ApplicationCategory | "ALL";
  method?: ApplicationRegistrationMethod | "ALL";
  status?: ApplicationStatus | "ALL";
  environment?: ApplicationEnvironment | "ALL";
}

export interface RegistrationResponse {
  success: boolean;
  application: RegisteredApplication;
  message: string;
  isMock?: boolean;
}

export interface RiskItem {
  id: string;
  category: "Accuracy" | "Grounding" | "Safety" | "Security" | "Consistency" | "Bias" | "Drift";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  status: "OPEN" | "MITIGATED";
  detectedAt: string;
  affectedComponent: string;
}

export interface TestSuiteItem {
  id: string;
  name: string;
  category: string;
  testCount: number;
  status: "READY" | "OUTDATED" | "EVALUATING";
  lastRun?: string;
  passRate?: number;
}

export interface EvaluationRunSummary {
  id: string;
  runNumber: string;
  version: string;
  status: "COMPLETED" | "RUNNING" | "FAILED" | "CANCELLED";
  overallScore?: number;
  recommendation?: "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";
  startedAt: string;
  completedAt?: string;
  totalTests: number;
  criticalFindings: number;
}

export interface FindingItem {
  id: string;
  title: string;
  pillar: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  promptExcerpt?: string;
  evidenceSnippet?: string;
  runId: string;
}

export interface RegressionItem {
  id: string;
  testName: string;
  sourceFindingId: string;
  baselineScore: number;
  currentScore: number;
  status: "PASSING" | "FAILING";
  lastChecked: string;
}

export interface ReleaseReviewItem {
  id: string;
  runId: string;
  decision: "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";
  reviewer: string;
  explanation: string;
  blockersCount: number;
  warningsCount: number;
  reviewedAt: string;
}
