import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { ENV } from "@/utils/env";

/**
 * QualiTrust AI — Centralized HTTP Client
 *
 * All outbound network requests are channeled through this Axios singleton.
 * Request interceptors inject session authorization credentials.
 * Response interceptors normalize backend errors, unwrap standard response envelopes,
 * and intercept 401 unauthenticated signals.
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
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("qualitrust_access_token") ||
          localStorage.getItem("qualitrust_token")
        : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Envelope Normalization & Error Handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Automatically unwrap standard backend envelope { data: ..., request_id: ... }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "request_id" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage) {
      error.message = backendMessage;
    }
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // Safe redirect or session clean
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
