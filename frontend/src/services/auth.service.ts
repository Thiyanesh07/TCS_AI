/**
 * QualiTrust AI — Authentication Service
 *
 * Production Contract: PENDING_BACKEND_CONFIRMATION
 * Demo Mode: Fully operational with local judge access
 */

import { isDemoMode } from "@/utils/env";
import { demoAuthService } from "@/demo";
import { apiClient } from "./api.client";

export const authService = {
  async login(email: string, password?: string) {
    if (isDemoMode()) {
      return demoAuthService.login(email, password);
    }

    // Production backend login call
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  async quickDemoLogin(role: "PLATFORM_ADMIN" | "ORG_USER") {
    return demoAuthService.quickLogin(role);
  },

  logout() {
    if (isDemoMode()) {
      demoAuthService.logout();
    } else {
      localStorage.removeItem("qualitrust_token");
      localStorage.removeItem("qualitrust_active_role");
    }
  },

  getCurrentSession() {
    if (isDemoMode()) {
      return demoAuthService.getCurrentSession();
    }
    return null;
  },
};

export default authService;
