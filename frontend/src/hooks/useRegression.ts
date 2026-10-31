import { useQuery } from "@tanstack/react-query";
import { regressionService } from "@/services/regression.service";

export const REGRESSION_KEYS = {
  all: ["regression"] as const,
  benchmarks: (params?: Record<string, string | undefined>) =>
    [...REGRESSION_KEYS.all, "benchmarks", params] as const,
};

export function useRegressionBenchmarks(params?: {
  classification?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: REGRESSION_KEYS.benchmarks(params),
    queryFn: () => regressionService.getRegressionBenchmarks(params),
  });
}

