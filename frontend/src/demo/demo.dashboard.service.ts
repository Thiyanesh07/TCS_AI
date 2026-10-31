/**
 * QualiTrust AI — Demo Dashboard Service
 */

import { OrgUserDashboardMetrics, PlatformAdminDashboardMetrics } from "@/services/dashboard.service";
import { demoStore } from "./demo.store";

export const demoDashboardService = {
  async getOrgUserMetrics(): Promise<OrgUserDashboardMetrics> {
    const apps = demoStore.getApplications();
    const runs = demoStore.getRuns();

    const avgScore =
      apps.length > 0
        ? Math.round(apps.reduce((acc, a) => acc + (a.latestScore || 85), 0) / apps.length)
        : 92;

    const totalBlockers = runs.reduce((acc, r) => acc + (r.blockersCount || 0), 0);
    const totalWarnings = runs.reduce((acc, r) => acc + (r.warningsCount || 0), 0);

    return {
      totalApplications: apps.length,
      totalEvaluations: runs.length,
      averageQualityScore: avgScore,
      releaseReadinessStatus: totalBlockers > 0 ? "BLOCKED" : totalWarnings > 2 ? "CONDITIONAL" : "READY",
      releaseScore: avgScore,
      criticalBlockers: totalBlockers,
      activeWarnings: totalWarnings,
    };
  },

  async getPlatformAdminMetrics(): Promise<PlatformAdminDashboardMetrics> {
    const apps = demoStore.getApplications();
    const runs = demoStore.getRuns();

    return {
      totalOrganisations: 6,
      totalApplications: apps.length + 12,
      totalEvaluations: runs.length + 8420,
      platformActiveUsers: 34,
      systemStatus: "OPERATIONAL",
    };
  },
};
