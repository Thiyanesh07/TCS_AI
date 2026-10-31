/**
 * QualiTrust AI — AI Application Registry Service
 *
 * Status: PENDING_BACKEND_CONFIRMATION
 * Centralized service for application onboarding and management.
 * Integrates with the centralized Axios client singleton.
 *
 * Audit Fix: Strictly genuine upload progress; zero simulated success responses.
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
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) formData.append("description", payload.description);
    formData.append("version", payload.version);
    formData.append("category", payload.category);
    formData.append("environment", payload.environment);
    formData.append("package", payload.file);

    try {
      const response = await apiClient.post<RegistrationResponse>("/applications/upload-zip", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percentCompleted);
          }
        },
      });
      return response.data;
    } catch {
      // Do NOT simulate successful registration or progress when backend call fails.
      throw new Error(
        "Backend Gateway Offline: The application archive upload endpoint is unavailable. Local file validation passed (.zip format, <50MB ceiling), but registration requires an active backend server (Contract Status: PENDING_BACKEND_CONFIRMATION)."
      );
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
    try {
      const response = await apiClient.post<RegistrationResponse>("/applications/connect-api", {
        name: payload.name,
        description: payload.description,
        version: payload.version,
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
      return response.data;
    } catch {
      // Do NOT simulate successful registration when backend call fails.
      throw new Error(
        "Backend Gateway Offline: The API registration endpoint is unavailable. Local URL and schema validation passed, but endpoint verification requires an active backend server (Contract Status: PENDING_BACKEND_CONFIRMATION)."
      );
    }
  },

  /**
   * Retrieve list of registered applications with optional filtering.
   * Returns live data when backend responds; falls back to explicit DEVELOPMENT_MOCK_ONLY fixtures.
   */
  async getApplications(params?: ApplicationFilterParams): Promise<RegisteredApplication[]> {
    try {
      const response = await apiClient.get<RegisteredApplication[]>("/applications", { params });
      return response.data.map((app) => ({ ...app, dataSource: "LIVE_BACKEND" }));
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
    try {
      const response = await apiClient.get<RegisteredApplication>(`/applications/${id}`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      const found = MOCK_APPLICATIONS.find((app) => app.id === id);
      return found ? { ...found, dataSource: "DEVELOPMENT_MOCK_ONLY" } : null;
    }
  },
};

export default applicationService;
