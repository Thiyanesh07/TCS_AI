/**
 * QualiTrust AI — AI Evaluation Execution Service
 *
 * Centralized service for triggering, polling, and retrieving evaluation runs.
 * Integrates with the centralized Axios client singleton.
 * Live integration with FastAPI backend evaluation engine.
 */

import { apiClient } from "@/services/api.client";
import {
  StartEvaluationPayload,
  EvaluationRunDetail,
} from "@/types/evaluation.types";
import { MOCK_EVALUATION_RUN_DETAIL } from "@/mocks/evaluation.mock";

export const evaluationService = {
  /**
   * Configure & Trigger a New Evaluation Run
   *
   * Transmits evaluation configuration to backend engine.
   */
  async startEvaluation(
    payload: StartEvaluationPayload
  ): Promise<{ runId: string; message: string }> {
    try {
      const response = await apiClient.post<any>("/evaluations/start", payload);
      const raw = response.data?.data || response.data;
      const runId = raw.runId || raw.id || response.data?.runId;
      return {
        runId: String(runId),
        message: raw.message || "Evaluation started successfully.",
      };
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to trigger evaluation run on backend.";
      throw new Error(detail);
    }
  },

  /**
   * Poll Current Progress of an Active Evaluation Run
   */
  async getEvaluationProgress(runId: string): Promise<EvaluationRunDetail> {
    try {
      const response = await apiClient.get<any>(`/evaluations/${runId}/progress`);
      const raw = response.data?.data || response.data;
      return { ...raw, dataSource: "LIVE_BACKEND" };
    } catch (err: any) {
      if (runId === "run_9841") {
        return { ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" };
      }

      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        err.message ||
        `Evaluation run "${runId}" not found on backend.`;
      throw new Error(detail);
    }
  },

  /**
   * Retrieve Final Results and Metrics for a Completed Run
   */
  async getEvaluationResults(runId: string): Promise<EvaluationRunDetail> {
    try {
      const response = await apiClient.get<any>(`/evaluations/${runId}/progress`);
      const raw = response.data?.data || response.data;
      return { ...raw, dataSource: "LIVE_BACKEND" };
    } catch (err: any) {
      if (runId === "run_9841") {
        return { ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" };
      }

      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        err.message ||
        `Evaluation results for run "${runId}" are unavailable on backend.`;
      throw new Error(detail);
    }
  },

  /**
   * Retrieve Catalog of Evaluation History
   */
  async getEvaluationHistory(): Promise<EvaluationRunDetail[]> {
    try {
      const response = await apiClient.get<any>("/evaluations/history");
      const raw = response.data?.data || response.data;
      if (Array.isArray(raw)) {
        return raw.map((run: any) => ({ ...run, dataSource: "LIVE_BACKEND" }));
      }
      return [{ ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" }];
    } catch {
      return [{ ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" }];
    }
  },
};

export default evaluationService;
