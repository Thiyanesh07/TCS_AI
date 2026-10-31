import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

/**
 * Hook to retrieve Organization User metrics via TanStack Query
 */
export function useOrgUserMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics", "org-user"],
    queryFn: () => dashboardService.getOrgUserMetrics(),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Hook to retrieve Platform Admin metrics via TanStack Query
 */
export function usePlatformAdminMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics", "platform-admin"],
    queryFn: () => dashboardService.getPlatformAdminMetrics(),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

