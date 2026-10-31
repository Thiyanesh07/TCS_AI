import { apiClient } from "@/services/api.client";
import { RegressionBenchmark } from "@/types/release.types";
import { MOCK_REGRESSION_BENCHMARKS } from "@/mocks/release.mock";

export const regressionService = {
  /**
   * Retrieve continuous regression benchmarks and historical differentials.
   */
  async getRegressionBenchmarks(params?: {
    classification?: string;
    status?: string;
  }): Promise<RegressionBenchmark[]> {
    try {
      const response = await apiClient.get<RegressionBenchmark[]>("/regression/benchmarks", { params });
      return response.data.map((b) => ({ ...b, dataSource: "LIVE_BACKEND" }));
    } catch {
      let results = [...MOCK_REGRESSION_BENCHMARKS];
      if (params?.classification && params.classification !== "ALL") {
        results = results.filter((b) => b.classification === params.classification);
      }
      if (params?.status && params.status !== "ALL") {
        results = results.filter((b) => b.status === params.status);
      }
      return results;
    }
  },
};

export default regressionService;
