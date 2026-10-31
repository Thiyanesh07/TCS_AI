/**
 * QualiTrust AI — AI Application Registry Service
 *
 * Centralized service for application onboarding and management.
 * Integrates with the centralized Axios client singleton.
 * Full end-to-end integration with FastAPI backend endpoints.
 */

import { apiClient } from "@/services/api.client";
import {
  RegisteredApplication,
  ZipUploadPayload,
  ApiRegistrationPayload,
  ApplicationFilterParams,
  RegistrationResponse,
} from "@/types/application.types";
import { MOCK_APPLICATIONS } from "@/mocks/application.mock";
import { isDemoMode } from "@/utils/env";
import { demoApplicationService } from "@/demo";

export const applicationService = {
  /**
   * Register an AI Application via ZIP Package Upload (Method A)
   *
   * Transmits ZIP archive as multipart/form-data.
   * Progress is derived strictly from genuine Axios upload events.
   * Strict Rule: No client-side ZIP extraction, no simulated upload steps.
   */
  async registerZipApplication(
    payload: ZipUploadPayload,
    onProgress?: (percent: number) => void
  ): Promise<RegistrationResponse> {
    if (isDemoMode()) {
      return demoApplicationService.registerZipApplication(payload, onProgress);
    }

    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) formData.append("description", payload.description);
    formData.append("version", payload.version);
    formData.append("version_label", payload.version);
    formData.append("category", payload.category);
    formData.append("environment", payload.environment);
    // Send both 'file' and 'package' for maximum endpoint compatibility
    formData.append("file", payload.file);
    formData.append("package", payload.file);

    try {
      const response = await apiClient.post<any>("/applications/upload-zip", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percentCompleted);
          }
        },
      });

      const raw = response.data?.data || response.data?.application || response.data;
      const app: RegisteredApplication = {
        id: raw.id,
        name: raw.name || payload.name,
        description: raw.description || payload.description || "",
        method: raw.integration_type === "api" ? "API_CONNECT" : "ZIP_UPLOAD",
        status: raw.status || "ACTIVE",
        version: payload.version,
        environment: payload.environment,
        category: payload.category,
        createdAt: raw.created_at || new Date().toISOString(),
        updatedAt: raw.updated_at || new Date().toISOString(),
        evaluationsCount: 0,
        openRisksCount: 0,
        zipDetails: {
          fileName: payload.file.name,
          fileSize: payload.file.size,
          fileSizeBytes: payload.file.size,
        },
        dataSource: "LIVE_BACKEND",
      };

      return {
        success: true,
        application: app,
        message: "Application package registered successfully.",
      };
    } catch (err: any) {
      const serverDetail =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        err.message ||
        "Backend error occurred while registering ZIP archive.";
      throw new Error(serverDetail);
    }
  },

  /**
   * Register an AI Application via API Endpoint (Method B)
   *
   * Transmits endpoint configuration and credentials securely.
   * Strict Rule: Never log sensitive tokens or expose credentials in plain text.
   */
  async registerApiApplication(
    payload: ApiRegistrationPayload
  ): Promise<RegistrationResponse> {
    if (isDemoMode()) {
      return demoApplicationService.registerApiApplication(payload);
    }

    try {
      const targetUrl = `${payload.baseUrl.replace(/\/+$/, "")}/${payload.endpointPath.replace(/^\/+/, "")}`;
      const response = await apiClient.post<any>("/applications/connect-api", {
        name: payload.name,
        description: payload.description,
        version: payload.version,
        version_label: payload.version,
        target_url: targetUrl,
        category: payload.category,
        environment: payload.environment,
        baseUrl: payload.baseUrl,
        endpointPath: payload.endpointPath,
        httpMethod: payload.httpMethod,
        authType: payload.authType,
        secretToken: payload.secretToken,
        headerName: payload.headerName,
        requestSchema: payload.requestSchema,
        responseSchema: payload.responseSchema,
      });

      const raw = response.data?.data || response.data?.application || response.data;
      const app: RegisteredApplication = {
        id: raw.id,
        name: raw.name || payload.name,
        description: raw.description || payload.description || "",
        method: "API_CONNECT",
        status: raw.status || "ACTIVE",
        version: payload.version,
        environment: payload.environment,
        category: payload.category,
        createdAt: raw.created_at || new Date().toISOString(),
        updatedAt: raw.updated_at || new Date().toISOString(),
        evaluationsCount: 0,
        openRisksCount: 0,
        apiDetails: {
          baseUrl: payload.baseUrl,
          endpointPath: payload.endpointPath,
          httpMethod: payload.httpMethod,
          authType: payload.authType,
          headerName: payload.headerName,
          hasSecret: Boolean(payload.secretToken),
        },
        dataSource: "LIVE_BACKEND",
      };

      return {
        success: true,
        application: app,
        message: "API target registered successfully.",
      };
    } catch (err: any) {
      const serverDetail =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        err.message ||
        "Backend error occurred while registering API endpoint.";
      throw new Error(serverDetail);
    }
  },

  /**
   * Retrieve list of registered applications with optional filtering.
   * Returns live data when backend responds; falls back to explicit DEVELOPMENT_MOCK_ONLY fixtures.
   */
  async getApplications(params?: ApplicationFilterParams): Promise<RegisteredApplication[]> {
    if (isDemoMode()) {
      return demoApplicationService.getApplications(params);
    }

    try {
      const response = await apiClient.get<any>("/applications", { params });
      const rawList = Array.isArray(response.data)
        ? response.data
        : response.data?.items || response.data?.data?.items || [];

      return rawList.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: app.description || "",
        method: app.integration_type === "api" ? "API_CONNECT" : "ZIP_UPLOAD",
        status: app.status || "ACTIVE",
        version: app.version_label || "v1.0.0",
        environment: "DEVELOPMENT",
        category: "RAG",
        createdAt: app.created_at || new Date().toISOString(),
        updatedAt: app.updated_at || new Date().toISOString(),
        evaluationsCount: 0,
        openRisksCount: 0,
        dataSource: "LIVE_BACKEND" as const,
      }));
    } catch {
      // Filter clearly tagged development mock fixtures
      let result = [...MOCK_APPLICATIONS];

      if (params?.search) {
        const query = params.search.toLowerCase();
        result = result.filter(
          (app) =>
            app.name.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query) ||
            app.id.toLowerCase().includes(query)
        );
      }

      if (params?.category && params.category !== "ALL") {
        result = result.filter((app) => app.category === params.category);
      }

      if (params?.method && params.method !== "ALL") {
        result = result.filter((app) => app.method === params.method);
      }

      if (params?.status && params.status !== "ALL") {
        result = result.filter((app) => app.status === params.status);
      }

      if (params?.environment && params.environment !== "ALL") {
        result = result.filter((app) => app.environment === params.environment);
      }

      return result;
    }
  },

  /**
   * Retrieve specific registered application by unique ID.
   */
  async getApplicationById(id: string): Promise<RegisteredApplication | null> {
    if (isDemoMode()) {
      return demoApplicationService.getApplicationById(id);
    }

    try {
      const response = await apiClient.get<any>(`/applications/${id}`);
      const raw = response.data?.data || response.data?.application || response.data;
      if (!raw || !raw.id) return null;
      return {
        id: raw.id,
        name: raw.name,
        description: raw.description || "",
        method: raw.integration_type === "api" ? "API_CONNECT" : "ZIP_UPLOAD",
        status: raw.status || "ACTIVE",
        version: raw.version_label || "v1.0.0",
        environment: "DEVELOPMENT",
        category: "RAG",
        createdAt: raw.created_at || new Date().toISOString(),
        updatedAt: raw.updated_at || new Date().toISOString(),
        evaluationsCount: 0,
        openRisksCount: 0,
        dataSource: "LIVE_BACKEND" as const,
      };
    } catch {
      const found = MOCK_APPLICATIONS.find((app) => app.id === id);
      return found ? { ...found, dataSource: "DEVELOPMENT_MOCK_ONLY" } : null;
    }
  },
};

export default applicationService;
