import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { ENV } from "@/utils/env";

/**
 * QualiTrust AI — Centralized HTTP Client
 *
 * All outbound network requests are channeled through this Axios singleton.
 * Request interceptors inject session authorization credentials.
 * Response interceptors normalize backend errors and intercept 401 unauthenticated signals.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach authentication token (when session exists)
apiClient.interceptors.request.use(
  (config) => {
    // Note: Bearer token or cookie handling will be confirmed with backend team
    const token = typeof window !== "undefined" ? localStorage.getItem("qualitrust_token") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Normalization
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Broadcast unauthenticated event or trigger session refresh
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // Safe UX redirection hook placeholder
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
