/**
 * QualiTrust AI — Demo Authentication Service
 *
 * Provides instant, zero-backend judge login for both ORG_USER and PLATFORM_ADMIN roles.
 */

import { UserRole } from "@/types/auth.types";
import { DEMO_AUTH_USER_KEY } from "./demo.config";

export interface DemoUserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organisationId: string;
  organisationName: string;
  token: string;
}

export const DEMO_CREDENTIALS = {
  ORG_USER: {
    email: "user@qualitrust.ai",
    password: "DemoPassword123!",
    name: "Alex Vance (Lead Quality Engineer)",
    role: "ORG_USER" as UserRole,
    organisationId: "org-101",
    organisationName: "Nexus Health Systems",
  },
  PLATFORM_ADMIN: {
    email: "admin@qualitrust.ai",
    password: "DemoAdmin123!",
    name: "Dr. Sarah Chen (Platform Superadmin)",
    role: "PLATFORM_ADMIN" as UserRole,
    organisationId: "org-global-admin",
    organisationName: "QualiTrust Global Operations",
  },
};

export const demoAuthService = {
  login(email: string, _password?: string): DemoUserSession {
    const isPlatformAdmin = email.toLowerCase().includes("admin");
    const template = isPlatformAdmin
      ? DEMO_CREDENTIALS.PLATFORM_ADMIN
      : DEMO_CREDENTIALS.ORG_USER;

    const session: DemoUserSession = {
      id: isPlatformAdmin ? "usr_demo_admin" : "usr_demo_user",
      name: template.name,
      email: email.trim() || template.email,
      role: template.role,
      organisationId: template.organisationId,
      organisationName: template.organisationName,
      token: `demo_jwt_token_${isPlatformAdmin ? "admin" : "user"}_${Date.now()}`,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_AUTH_USER_KEY, JSON.stringify(session));
      window.localStorage.setItem("qualitrust_token", session.token);
      window.localStorage.setItem("qualitrust_active_role", session.role);
    }

    return session;
  },

  quickLogin(role: UserRole): DemoUserSession {
    const template =
      role === "PLATFORM_ADMIN"
        ? DEMO_CREDENTIALS.PLATFORM_ADMIN
        : DEMO_CREDENTIALS.ORG_USER;

    return this.login(template.email, template.password);
  },

  getCurrentSession(): DemoUserSession | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(DEMO_AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return null;
  },

  logout(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEMO_AUTH_USER_KEY);
    window.localStorage.removeItem("qualitrust_token");
    window.localStorage.removeItem("qualitrust_active_role");
  },
};
