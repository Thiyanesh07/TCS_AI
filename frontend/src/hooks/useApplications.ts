import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import {
  ApplicationFilterParams,
  ZipUploadPayload,
  ApiRegistrationPayload,
} from "@/types/application.types";

export const APPLICATION_KEYS = {
  all: ["applications"] as const,
  lists: () => [...APPLICATION_KEYS.all, "list"] as const,
  list: (params?: ApplicationFilterParams) => [...APPLICATION_KEYS.lists(), params] as const,
  details: () => [...APPLICATION_KEYS.all, "detail"] as const,
  detail: (id: string) => [...APPLICATION_KEYS.details(), id] as const,
};

export function useApplications(params?: ApplicationFilterParams) {
  return useQuery({
    queryKey: APPLICATION_KEYS.list(params),
    queryFn: () => applicationService.getApplications(params),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: APPLICATION_KEYS.detail(id || ""),
    queryFn: () => (id ? applicationService.getApplicationById(id) : null),
    enabled: Boolean(id),
  });
}

export function useRegisterZipApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      onProgress,
    }: {
      payload: ZipUploadPayload;
      onProgress?: (percent: number) => void;
    }) => applicationService.registerZipApplication(payload, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useRegisterApiApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApiRegistrationPayload) =>
      applicationService.registerApiApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

