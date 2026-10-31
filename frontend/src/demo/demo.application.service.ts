/**
 * QualiTrust AI — Demo Application Service
 *
 * Simulates both ZIP archive onboarding and REST API registration locally.
 */

import {
  RegisteredApplication,
  ZipUploadPayload,
  ApiRegistrationPayload,
  ApplicationFilterParams,
  RegistrationResponse,
} from "@/types/application.types";
import { demoStore } from "./demo.store";

export const demoApplicationService = {
  async registerZipApplication(
    payload: ZipUploadPayload,
    onProgress?: (percent: number) => void
  ): Promise<RegistrationResponse> {
    // 1. Simulated upload progress steps
    if (onProgress) {
      onProgress(15);
      await new Promise((r) => setTimeout(r, 120));
      onProgress(45);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(80);
      await new Promise((r) => setTimeout(r, 120));
      onProgress(100);
    }

    const newId = `app_demo_zip_${Date.now()}`;
    const newApp: RegisteredApplication = {
      id: newId,
      name: payload.name.trim(),
      description: payload.description?.trim() || "Locally onboarded demonstration ZIP archive workload.",
      version: payload.version.trim() || "v1.0.0",
      category: payload.category,
      environment: payload.environment,
      method: "ZIP_UPLOAD",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latestScore: 92,
      latestRecommendation: "RELEASE",
      evaluationsCount: 0,
      openRisksCount: 0,
      zipDetails: {
        fileName: payload.file.name,
        fileSize: Math.round(payload.file.size / (1024 * 1024)),
        fileSizeBytes: payload.file.size,
      },
      discoverySummary: {
        modelDetected: "Claude-3.5-Sonnet (Discovered)",
        framework: "FastAPI + LangChain",
        vectorStore: "pgvector (Local)",
        endpointsCount: 8,
        status: "COMPLETED",
      },
      isMock: true,
      dataSource: "DEVELOPMENT_MOCK_ONLY",
    };

    demoStore.addApplication(newApp);

    return {
      success: true,
      application: newApp,
      message: "Demonstration archive registered successfully. No files extracted on client.",
      isMock: true,
    };
  },

  async registerApiApplication(
    payload: ApiRegistrationPayload
  ): Promise<RegistrationResponse> {
    await new Promise((r) => setTimeout(r, 300));

    const newId = `app_demo_api_${Date.now()}`;
    const newApp: RegisteredApplication = {
      id: newId,
      name: payload.name.trim(),
      description: payload.description?.trim() || "Locally registered demonstration REST API endpoint workload.",
      version: payload.version.trim() || "v1.0.0",
      category: payload.category,
      environment: payload.environment,
      method: "API_CONNECT",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latestScore: 88,
      latestRecommendation: "RELEASE",
      evaluationsCount: 0,
      openRisksCount: 1,
      apiDetails: {
        baseUrl: payload.baseUrl,
        endpointPath: payload.endpointPath,
        httpMethod: payload.httpMethod,
        authType: payload.authType,
        headerName: payload.headerName,
        hasSecret: !!payload.secretToken,
      },
      discoverySummary: {
        modelDetected: "Mistral-Large (Discovered)",
        framework: "REST Inference Proxy",
        vectorStore: "Managed Vector Engine",
        endpointsCount: 4,
        status: "COMPLETED",
      },
      isMock: true,
      dataSource: "DEVELOPMENT_MOCK_ONLY",
    };

    demoStore.addApplication(newApp);

    return {
      success: true,
      application: newApp,
      message: "Demo registration completed locally. API connectivity has not been verified.",
      isMock: true,
    };
  },

  async getApplications(params?: ApplicationFilterParams): Promise<RegisteredApplication[]> {
    let result = demoStore.getApplications();

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q)
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
  },

  async getApplicationById(id: string): Promise<RegisteredApplication | null> {
    return demoStore.getApplicationById(id);
  },
};
