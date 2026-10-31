import { apiClient } from "./api.client";
import { MOCK_ORG_USER_METRICS, MOCK_ADMIN_METRICS } from "@/mocks/dashboard.mock";
import { isDemoMode } from "@/utils/env";
import { demoDashboardService } from "@/demo";

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
 */
export const dashboardService = {
  async getOrgUserMetrics(): Promise<OrgUserDashboardMetrics> {
    if (isDemoMode()) {
      return demoDashboardService.getOrgUserMetrics();
    }

    try {
      const response = await apiClient.get<OrgUserDashboardMetrics>("/dashboard/metrics/user");
      return response.data;
    } catch {
      // Contract is pending backend confirmation. Return isolated development mock fixture.
      return MOCK_ORG_USER_METRICS;
    }
  },

  async getPlatformAdminMetrics(): Promise<PlatformAdminDashboardMetrics> {
    if (isDemoMode()) {
      return demoDashboardService.getPlatformAdminMetrics();
    }

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
