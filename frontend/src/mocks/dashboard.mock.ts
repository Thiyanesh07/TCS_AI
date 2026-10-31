/**
 * QualiTrust AI — Dashboard Mock Fixtures (Development Isolation Only)
 *
 * NOTE: These fixtures are strictly for local component development and layout verification.
 * They are NEVER mixed with production APIs.
 * CONTRACT STATUS: PENDING_BACKEND_CONFIRMATION
 */

export const MOCK_ORG_USER_METRICS = {
  totalApplications: 6,
  totalEvaluations: 1240,
  averageQualityScore: 94.2,
  releaseReadinessStatus: "READY" as const,
  releaseScore: 94,
  criticalBlockers: 0,
  activeWarnings: 1,
};

export const MOCK_ADMIN_METRICS = {
  totalOrganisations: 28,
  totalApplications: 142,
  totalEvaluations: 48920,
  platformActiveUsers: 340,
  systemStatus: "OPERATIONAL" as const,
};

