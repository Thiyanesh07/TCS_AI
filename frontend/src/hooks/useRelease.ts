import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { releaseService } from "@/services/release.service";
import { ReviewSubmissionPayload } from "@/types/release.types";

export const RELEASE_KEYS = {
  all: ["releaseReviews"] as const,
  lists: () => [...RELEASE_KEYS.all, "list"] as const,
  list: (params?: Record<string, string | undefined>) =>
    [...RELEASE_KEYS.lists(), params] as const,
  details: () => [...RELEASE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...RELEASE_KEYS.details(), id] as const,
};

export function useReleaseReviews(params?: { status?: string; decision?: string }) {
  return useQuery({
    queryKey: RELEASE_KEYS.list(params),
    queryFn: () => releaseService.getReleaseReviews(params),
  });
}

export function useReleaseReview(id: string | undefined) {
  return useQuery({
    queryKey: RELEASE_KEYS.detail(id || ""),
    queryFn: () => (id ? releaseService.getReleaseReviewById(id) : null),
    enabled: Boolean(id),
  });
}

export function useSubmitReviewDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewSubmissionPayload) =>
      releaseService.submitReviewDecision(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: RELEASE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RELEASE_KEYS.detail(vars.reviewId) });
    },
  });
}

