/**
 * QualiTrust AI — Demo Evaluation Service
 *
 * Deterministic multi-stage simulation of the 8-stage AI evaluation pipeline.
 */

import {
  StartEvaluationPayload,
  EvaluationRunDetail,
  EvaluationStage,
} from "@/types/evaluation.types";
import { EVALUATION_STAGES_TEMPLATE } from "@/mocks/evaluation.mock";
import { demoStore } from "./demo.store";
import { DEMO_SCENARIOS } from "./demo.scenarios";

// Map each of the 8 stages to realistic pod console execution logs
const STAGE_LOGS: Record<number, string[]> = {
  0: [
    "[DEMO-ENGINE] Initializing local ephemeral evaluation sandbox container...",
    "[DEMO-ENGINE] Allocating virtual compute pod with target concurrency limit.",
    "[DEMO-ENGINE] Stage 1: Inspecting target application schema and endpoint contracts.",
  ],
  1: [
    "[DEMO-ENGINE] Schema validation successful: 0 structural schema errors detected.",
    "[DEMO-ENGINE] Stage 2: Performing threat modeling across 7 vulnerability vectors.",
    "[DEMO-ENGINE] Evaluating adversarial surface and tool execution permissions.",
  ],
  2: [
    "[DEMO-ENGINE] Threat surface identified: Synthesizing dynamic golden assertion set.",
    "[DEMO-ENGINE] Stage 3: Synthesizing multi-turn adversarial prompts & domain invariants.",
    "[DEMO-ENGINE] Golden test assertion set compiled with full domain coverage.",
  ],
  3: [
    "[DEMO-ENGINE] Stage 4: Launching concurrent sandbox invocations across simulated workers.",
    "[DEMO-ENGINE] Executing prompts with latency and token-budget limits enforced.",
    "[DEMO-ENGINE] Model invocation throughput: ~38 req/sec. Ephemeral isolation maintained.",
  ],
  4: [
    "[DEMO-ENGINE] Invocations completed. Ingesting responses for semantic grounding checks.",
    "[DEMO-ENGINE] Stage 5: Verifying citations, hallucination bounds, and source context.",
    "[DEMO-ENGINE] Factuality verification against authoritative reference corpus completed.",
  ],
  5: [
    "[DEMO-ENGINE] Stage 6: Running invariant audits for Safety, Security, and Demographic Bias.",
    "[DEMO-ENGINE] Probing jailbreak resistance, prompt injection defenses, and PII filters.",
    "[DEMO-ENGINE] Invariant assertions evaluated.",
  ],
  6: [
    "[DEMO-ENGINE] Stage 7: Calculating 9-dimension composite quality vector & weights.",
    "[DEMO-ENGINE] Normalizing scores: Accuracy, Grounding, Completeness, Safety, Security, etc.",
    "[DEMO-ENGINE] Statistical variance across batches validated.",
  ],
  7: [
    "[DEMO-ENGINE] Stage 8: Release Intelligence Policy Engine synthesizing gate decision.",
    "[DEMO-ENGINE] Evaluating release threshold bounds and critical blocker policies.",
    "[DEMO-ENGINE] Evaluation run terminal status: COMPLETED. Results scorecard ready.",
  ],
};

export const demoEvaluationService = {
  async startEvaluation(
    payload: StartEvaluationPayload
  ): Promise<{ runId: string; message: string }> {
    const app = demoStore.getApplicationById(payload.applicationId);
    const appName = app ? app.name : "Target AI Application";

    const timestamp = Date.now();
    const runId = `demo_run_${timestamp}`;
    const runNumber = `DEMO-RUN-${timestamp.toString().slice(-4)}`;

    // Build initial stages: Stage 0 is active, rest pending
    const initialStages: EvaluationStage[] = EVALUATION_STAGES_TEMPLATE.map((s, idx) => ({
      ...s,
      status: idx === 0 ? "active" : "pending",
      durationSeconds: undefined,
    }));

    const activeScenarioId = demoStore.getActiveScenarioId();
    const scenario = DEMO_SCENARIOS[activeScenarioId];

    const newRun: EvaluationRunDetail = {
      id: runId,
      runNumber,
      applicationId: payload.applicationId,
      applicationName: appName,
      applicationVersion: payload.version,
      environment: payload.environment,
      status: "RUNNING",
      scope: payload.scope,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      overallScore: scenario.definition.overallScore,
      recommendation: scenario.definition.recommendation,
      recommendationExplanation: scenario.recommendationExplanation,
      blockersCount: scenario.blockersCount,
      warningsCount: scenario.warningsCount,
      stages: initialStages,
      dimensions: scenario.dimensions,
      testExecution: scenario.testExecution,
      findingsBreakdown: {
        critical: scenario.blockersCount,
        high: scenario.warningsCount > 2 ? 2 : 1,
        medium: 2,
        low: 1,
      },
      findings: scenario.findings,
      executionLogs: [
        `[${new Date().toLocaleTimeString()}] [DISPATCH] Demo evaluation triggered for ${appName} (${payload.version}) [Scope: ${payload.scope}].`,
        ...STAGE_LOGS[0],
      ],
      isMock: true,
      dataSource: "DEVELOPMENT_MOCK_ONLY",
    };

    demoStore.addRun(newRun);

    return {
      runId,
      message: "Demonstration evaluation pipeline launched successfully in local sandbox.",
    };
  },

  async getEvaluationProgress(runId: string): Promise<EvaluationRunDetail> {
    const existing = demoStore.getRunById(runId);
    if (!existing) {
      throw new Error(`Demo evaluation run "${runId}" not found in local store.`);
    }

    if (existing.status === "COMPLETED" || existing.status === "FAILED") {
      return existing;
    }

    // Time-based deterministic progression
    // Calculate elapsed seconds since start
    const startTime = new Date(existing.startedAt).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.floor((now - startTime) / 1000));

    // There are 8 stages. We advance through them over ~16 seconds (2s per stage for a punchy demo)
    // Or if elapsedSeconds >= 16, it is completed.
    const activeStageIndex = Math.min(7, Math.floor(elapsedSeconds / 2));
    const isCompleted = elapsedSeconds >= 16;

    const updatedStages: EvaluationStage[] = existing.stages.map((stage, idx) => {
      if (isCompleted || idx < activeStageIndex) {
        return {
          ...stage,
          status: "completed",
          durationSeconds: stage.durationSeconds || Math.max(1, Math.floor(elapsedSeconds / 8)),
        };
      }
      if (idx === activeStageIndex) {
        return {
          ...stage,
          status: "active",
        };
      }
      return {
        ...stage,
        status: "pending",
      };
    });

    // Build cumulative logs up to current stage
    const cumulativeLogs: string[] = [
      `[${new Date(startTime).toLocaleTimeString()}] [DISPATCH] Demo evaluation triggered for ${existing.applicationName} (${existing.applicationVersion}).`,
    ];
    for (let i = 0; i <= activeStageIndex; i++) {
      if (STAGE_LOGS[i]) {
        cumulativeLogs.push(...STAGE_LOGS[i]);
      }
    }
    if (isCompleted) {
      cumulativeLogs.push(
        `[${new Date(now).toLocaleTimeString()}] [COMPLETE] All 8 pipeline stages executed successfully.`
      );
    }

    const updated = demoStore.updateRun(runId, (prev) => ({
      ...prev,
      elapsedSeconds,
      status: isCompleted ? "COMPLETED" : "RUNNING",
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      stages: updatedStages,
      executionLogs: cumulativeLogs,
    }));

    return updated || existing;
  },

  async getEvaluationResults(runId: string): Promise<EvaluationRunDetail> {
    const existing = demoStore.getRunById(runId);
    if (!existing) {
      throw new Error(`Evaluation results for "${runId}" not found in local store.`);
    }

    // Ensure status is marked completed when viewing results
    if (existing.status !== "COMPLETED") {
      const completed = demoStore.updateRun(runId, (prev) => ({
        ...prev,
        status: "COMPLETED",
        completedAt: prev.completedAt || new Date().toISOString(),
        stages: prev.stages.map((s) => ({ ...s, status: "completed" })),
      }));
      return completed || existing;
    }

    return existing;
  },

  async getEvaluationHistory(): Promise<EvaluationRunDetail[]> {
    return demoStore.getRuns();
  },

  async restartEvaluation(runId: string): Promise<EvaluationRunDetail> {
    const updated = demoStore.updateRun(runId, (prev) => ({
      ...prev,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      completedAt: undefined,
      elapsedSeconds: 0,
      stages: EVALUATION_STAGES_TEMPLATE.map((s, idx) => ({
        ...s,
        status: idx === 0 ? "active" : "pending",
      })),
      executionLogs: [
        `[${new Date().toLocaleTimeString()}] [RESTART] Demonstration evaluation restarted by judge.`,
        ...STAGE_LOGS[0],
      ],
    }));
    return updated || ({} as EvaluationRunDetail);
  },
};
