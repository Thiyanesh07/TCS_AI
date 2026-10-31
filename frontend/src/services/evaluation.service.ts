/**
 * QualiTrust AI — AI Evaluation Execution Service
 *
 * Status: PENDING_BACKEND_CONFIRMATION
 * Centralized service for triggering, polling, and retrieving evaluation runs.
 * Integrates with the centralized Axios client singleton.
 *
 * Audit Fix: Zero fake successful executions; explicit DEVELOPMENT_MOCK_ONLY labeling.
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
   * Strict Rule: Never simulate fake successful execution or fake progress when backend is unavailable.
   */
  async startEvaluation(
    payload: StartEvaluationPayload
  ): Promise<{ runId: string; message: string }> {
    try {
      const response = await apiClient.post<{ runId: string; message: string }>(
        "/evaluations/start",
        payload
      );
      return response.data;
    } catch {
      // Do NOT simulate fake successful execution if backend is offline.
      throw new Error(
        "Backend Evaluation Engine Offline: Evaluation trigger endpoint is unavailable (Contract Status: PENDING_BACKEND_CONFIRMATION). The evaluation configuration was validated locally, but execution requires an active sandbox engine."
      );
    }
  },

  /**
   * Poll Current Progress of an Active Evaluation Run
   */
  async getEvaluationProgress(runId: string): Promise<EvaluationRunDetail> {
    try {
      const response = await apiClient.get<EvaluationRunDetail>(`/evaluations/${runId}/progress`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      // If inspecting the seed development fixture, return it clearly marked
      if (runId === "run_9841") {
        return { ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" };
      }

      throw new Error(
        `Evaluation run "${runId}" not found on backend (Status: PENDING_BACKEND_CONFIRMATION).`
      );
    }
  },

  /**
   * Retrieve Final Results and Metrics for a Completed Run
   */
  async getEvaluationResults(runId: string): Promise<EvaluationRunDetail> {
    try {
      const response = await apiClient.get<EvaluationRunDetail>(`/evaluations/${runId}/results`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      // If inspecting the seed development fixture, return it clearly marked
      if (runId === "run_9841") {
        return { ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" };
      }

      throw new Error(
        `Evaluation results for run "${runId}" are unavailable on backend (Status: PENDING_BACKEND_CONFIRMATION).`
      );
    }
  },

  /**
   * Retrieve Catalog of Evaluation History
   */
  async getEvaluationHistory(): Promise<EvaluationRunDetail[]> {
    try {
      const response = await apiClient.get<EvaluationRunDetail[]>("/evaluations/history");
      return response.data.map((run) => ({ ...run, dataSource: "LIVE_BACKEND" }));
    } catch {
      // Return development mock fixtures clearly marked
      return [{ ...MOCK_EVALUATION_RUN_DETAIL, dataSource: "DEVELOPMENT_MOCK_ONLY" }];
    }
  },
};

export default evaluationService;
