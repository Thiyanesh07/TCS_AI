import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { evaluationService } from "@/services/evaluation.service";
import { StartEvaluationPayload } from "@/types/evaluation.types";

export const EVALUATION_KEYS = {
  all: ["evaluations"] as const,
  history: () => [...EVALUATION_KEYS.all, "history"] as const,
  progress: (runId: string) => [...EVALUATION_KEYS.all, "progress", runId] as const,
  results: (runId: string) => [...EVALUATION_KEYS.all, "results", runId] as const,
};

export function useEvaluationHistory() {
  return useQuery({
    queryKey: EVALUATION_KEYS.history(),
    queryFn: () => evaluationService.getEvaluationHistory(),
  });
}

export function useEvaluationProgress(runId: string | undefined) {
  return useQuery({
    queryKey: EVALUATION_KEYS.progress(runId || ""),
    queryFn: () => (runId ? evaluationService.getEvaluationProgress(runId) : null),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling on terminal states
      if (status === "COMPLETED" || status === "FAILED" || status === "CANCELLED") {
        return false;
      }
      return 2500; // Poll every 2.5s while active
    },
  });
}

export function useEvaluationResults(runId: string | undefined) {
  return useQuery({
    queryKey: EVALUATION_KEYS.results(runId || ""),
    queryFn: () => (runId ? evaluationService.getEvaluationResults(runId) : null),
    enabled: Boolean(runId),
  });
}

export function useStartEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartEvaluationPayload) =>
      evaluationService.startEvaluation(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EVALUATION_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: EVALUATION_KEYS.progress(data.runId) });
    },
  });
}

export function useRestartEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => evaluationService.restartEvaluation(runId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EVALUATION_KEYS.progress(data.id) });
      queryClient.invalidateQueries({ queryKey: EVALUATION_KEYS.results(data.id) });
    },
  });
}

