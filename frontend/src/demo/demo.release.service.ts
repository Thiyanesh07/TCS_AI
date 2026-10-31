/**
 * QualiTrust AI — Demo Release Governance Service
 */

import { ReleaseReviewRecord, ReviewSubmissionPayload } from "@/types/release.types";
import { demoStore } from "./demo.store";

export const demoReleaseService = {
  async getReleaseReviews(params?: {
    status?: string;
    decision?: string;
  }): Promise<ReleaseReviewRecord[]> {
    let results = demoStore.getReleaseReviews();

    if (params?.status && params.status !== "ALL") {
      results = results.filter((r) => r.status === params.status);
    }

    if (params?.decision && params.decision !== "ALL") {
      results = results.filter((r) => r.decision === params.decision);
    }

    return results;
  },

  async getReleaseReviewById(id: string): Promise<ReleaseReviewRecord | null> {
    return demoStore.getReleaseReviewById(id);
  },

  async submitReviewDecision(
    payload: ReviewSubmissionPayload
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 200));

    const statusMap = {
      RELEASE: "APPROVED" as const,
      REJECT: "REJECTED" as const,
      CONDITIONAL_RELEASE: "APPROVED" as const,
    };

    const updated = demoStore.updateReleaseReview(payload.reviewId, {
      decision: payload.decision,
      status: statusMap[payload.decision] || "APPROVED",
      comments: payload.comments,
      reviewedAt: new Date().toISOString(),
      reviewer: "Judge Evaluator (Demonstration Sign-off)",
      reviewerRole: "PLATFORM_ADMIN",
    });

    if (!updated) {
      throw new Error(`Demo release review "${payload.reviewId}" could not be updated.`);
    }

    return {
      success: true,
      message: "DEMO DECISION RECORDED — Successfully logged in local demo store.",
    };
  },
};
