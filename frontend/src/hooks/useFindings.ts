import { useQuery } from "@tanstack/react-query";
import { findingsService } from "@/services/findings.service";

export const FINDING_KEYS = {
  all: ["findings"] as const,
  lists: () => [...FINDING_KEYS.all, "list"] as const,
  list: (params?: Record<string, string | undefined>) =>
    [...FINDING_KEYS.lists(), params] as const,
  details: () => [...FINDING_KEYS.all, "detail"] as const,
  detail: (id: string) => [...FINDING_KEYS.details(), id] as const,
  reports: () => [...FINDING_KEYS.all, "reports"] as const,
  report: (runId: string) => [...FINDING_KEYS.reports(), runId] as const,
};

export function useFindings(params?: {
  search?: string;
  severity?: string;
  pillar?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: FINDING_KEYS.list(params),
    queryFn: () => findingsService.getFindings(params),
  });
}

export function useFinding(id: string | undefined) {
  return useQuery({
    queryKey: FINDING_KEYS.detail(id || ""),
    queryFn: () => (id ? findingsService.getFindingById(id) : null),
    enabled: Boolean(id),
  });
}

export function useQualityReport(runId: string | undefined) {
  return useQuery({
    queryKey: FINDING_KEYS.report(runId || ""),
    queryFn: () => (runId ? findingsService.getQualityReport(runId) : null),
    enabled: Boolean(runId),
  });
}

