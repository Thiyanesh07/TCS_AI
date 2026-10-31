/**
 * QualiTrust AI — Authentication Service
 *
 * Implements real JWT authentication against FastAPI backend:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/refresh
 * - GET /api/v1/auth/me
 */
import { apiClient } from "./api.client";

export interface LoginPayload {
  email: string;
  password: string;
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
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", payload);
    const data = response.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("qualitrust_access_token", data.access_token);
      localStorage.setItem("qualitrust_token", data.access_token);
      localStorage.setItem("qualitrust_refresh_token", data.refresh_token);
    }
    return data;
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("qualitrust_access_token");
      localStorage.removeItem("qualitrust_token");
      localStorage.removeItem("qualitrust_refresh_token");
      localStorage.removeItem("qualitrust_user");
    }
  },
};
