/**
 * QualiTrust AI — Authentication & Role Types
 *
 * The platform recognizes exactly two user roles:
 * - PLATFORM_ADMIN: System-level administrator
 * - ORG_USER: Tenant-level quality engineer / evaluator
 */

export type UserRole = "PLATFORM_ADMIN" | "ORG_USER";

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  isLoading: boolean;
}

