import { apiClient } from "@/services/api.client";
import { ReleaseReviewRecord, ReviewSubmissionPayload } from "@/types/release.types";
import { MOCK_RELEASE_REVIEWS } from "@/mocks/release.mock";

export const releaseService = {
  /**
   * Retrieve list of release governance review records.
   */
  async getReleaseReviews(params?: {
    status?: string;
    decision?: string;
  }): Promise<ReleaseReviewRecord[]> {
    try {
      const response = await apiClient.get<ReleaseReviewRecord[]>("/release-reviews", { params });
      return response.data.map((r) => ({ ...r, dataSource: "LIVE_BACKEND" }));
    } catch {
      let results = [...MOCK_RELEASE_REVIEWS];
      if (params?.status && params.status !== "ALL") {
        results = results.filter((r) => r.status === params.status);
      }
      if (params?.decision && params.decision !== "ALL") {
        results = results.filter((r) => r.decision === params.decision);
      }
      return results;
    }
  },

  /**
   * Retrieve specific release review by unique ID.
   */
  async getReleaseReviewById(id: string): Promise<ReleaseReviewRecord | null> {
    try {
      const response = await apiClient.get<ReleaseReviewRecord>(`/release-reviews/${id}`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      const found = MOCK_RELEASE_REVIEWS.find((r) => r.id === id);
      return found ? { ...found, dataSource: "DEVELOPMENT_MOCK_ONLY" } : null;
    }
  },

  /**
   * Submit human reviewer sign-off or veto decision.
   * Enforces backend authorization. Throws if backend is offline.
   */
  async submitReviewDecision(payload: ReviewSubmissionPayload): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/release-reviews/${payload.reviewId}/sign-off`,
        payload
      );
      return response.data;
    } catch {
      throw new Error(
        "Backend Release Governance Offline: Review decision submission requires an active backend service (Contract Status: PENDING_BACKEND_CONFIRMATION)."
      );
    }
  },
};

export default releaseService;
