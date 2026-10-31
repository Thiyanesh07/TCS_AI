/**
 * QualiTrust AI — Authentication Service
 *
 * Implements authentication supporting both:
 * 1. Live FastAPI Backend JWT endpoints (/auth/login, /auth/refresh, /auth/me)
 * 2. Instant local Demo Mode for judging reviews without backend dependencies
 */

import { isDemoMode } from "@/utils/env";
import { demoAuthService } from "@/demo";
import { apiClient } from "./api.client";

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "PLATFORM_ADMIN" | "ORG_USER";
  organisation_id: string;
  is_active: boolean;
  created_at: string;
}

export const authService = {
  async login(payloadOrEmail: LoginPayload | string, password?: string): Promise<LoginResponse | any> {
    const email = typeof payloadOrEmail === "string" ? payloadOrEmail : payloadOrEmail.email;
    const pwd = typeof payloadOrEmail === "string" ? password || "" : payloadOrEmail.password || "";

    if (isDemoMode()) {
      return demoAuthService.login(email, pwd);
    }

    const response = await apiClient.post<LoginResponse>("/auth/login", { email, password: pwd });
    const data = response.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("qualitrust_access_token", data.access_token);
      localStorage.setItem("qualitrust_token", data.access_token);
      localStorage.setItem("qualitrust_refresh_token", data.refresh_token);
    }
    return data;
  },

  async quickDemoLogin(role: "PLATFORM_ADMIN" | "ORG_USER") {
    return demoAuthService.quickLogin(role);
  },

  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/auth/me");
    const data = response.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("qualitrust_user", JSON.stringify(data));
    }
    return data;
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    const data = response.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("qualitrust_access_token", data.access_token);
      localStorage.setItem("qualitrust_token", data.access_token);
      localStorage.setItem("qualitrust_refresh_token", data.refresh_token);
    }
    return data;
  },

  logout(): void {
    if (isDemoMode()) {
      demoAuthService.logout();
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("qualitrust_access_token");
        localStorage.removeItem("qualitrust_token");
        localStorage.removeItem("qualitrust_refresh_token");
        localStorage.removeItem("qualitrust_user");
        localStorage.removeItem("qualitrust_active_role");
      }
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
