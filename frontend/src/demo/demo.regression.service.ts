/**
 * QualiTrust AI — Demo Regression Service
 */

import { RegressionBenchmark } from "@/types/release.types";
import { demoStore } from "./demo.store";

export const demoRegressionService = {
  async getRegressionBenchmarks(params?: {
    classification?: string;
    status?: string;
  }): Promise<RegressionBenchmark[]> {
    let results = demoStore.getRegressionBenchmarks();

    if (params?.classification && params.classification !== "ALL") {
      results = results.filter((b) => b.classification === params.classification);
    }

    if (params?.status && params.status !== "ALL") {
      results = results.filter((b) => b.status === params.status);
    }

    return results;
  },
};
