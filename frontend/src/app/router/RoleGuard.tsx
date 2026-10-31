import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/auth.types";

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  currentRole?: UserRole;
  fallbackPath?: string;
}

/**
 * QualiTrust AI — Role-Based Route Guard (UX Protection Layer)
 *
 * NOTE: Frontend route guards are for visual and navigational presentation only.
 * They NEVER replace or substitute server-side authorization enforcement.
 * True authorization and tenant isolation are enforced strictly by backend API endpoints.
 */
export function RoleGuard({
  allowedRoles,
  currentRole,
  fallbackPath = "/dashboard",
}: RoleGuardProps) {
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

export default RoleGuard;
