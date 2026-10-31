import { apiClient } from "./api.client";
import { MOCK_ORG_USER_METRICS, MOCK_ADMIN_METRICS } from "@/mocks/dashboard.mock";

export interface OrgUserDashboardMetrics {
  totalApplications: number;
  totalEvaluations: number;
  averageQualityScore: number;
  releaseReadinessStatus: "READY" | "CONDITIONAL" | "BLOCKED";
  releaseScore: number;
  criticalBlockers: number;
  activeWarnings: number;
}

export interface PlatformAdminDashboardMetrics {
  totalOrganisations: number;
  totalApplications: number;
  totalEvaluations: number;
  platformActiveUsers: number;
  systemStatus: "OPERATIONAL" | "DEGRADED" | "DOWN";
}

/**
 * QualiTrust AI — Centralized Dashboard Service
 *
 * All data retrieval is encapsulated here.
 * When real backend endpoints are confirmed, apiClient calls will activate seamlessly.
 */
export const dashboardService = {
  async getOrgUserMetrics(): Promise<OrgUserDashboardMetrics> {
    try {
      const response = await apiClient.get<OrgUserDashboardMetrics>("/dashboard/metrics/user");
      return response.data;
    } catch {
      // Contract is pending backend confirmation. Return isolated development mock fixture.
      return MOCK_ORG_USER_METRICS;
    }
  },

  async getPlatformAdminMetrics(): Promise<PlatformAdminDashboardMetrics> {
    try {
      const response = await apiClient.get<PlatformAdminDashboardMetrics>("/admin/dashboard/metrics");
      return response.data;
    } catch {
      // Contract is pending backend confirmation. Return isolated development mock fixture.
      return MOCK_ADMIN_METRICS;
    }
  },
};

export default dashboardService;
