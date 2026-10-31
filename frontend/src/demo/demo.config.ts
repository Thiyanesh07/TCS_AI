/**
 * QualiTrust AI — Demo Configuration & Constants
 */

export const DEMO_BANNER_MESSAGE =
  "DEMO MODE — Demonstration data. No live AI evaluation is being executed.";

export const DEMO_STORAGE_KEY = "qualitrust_demo_store_v1";
export const DEMO_SCENARIO_KEY = "qualitrust_demo_active_scenario";
export const DEMO_AUTH_USER_KEY = "qualitrust_demo_user";

export type DemoScenarioId =
  | "HEALTHY_APPLICATION"
  | "APPLICATION_WITH_RISKS"
  | "CRITICAL_SECURITY_FAILURE";

export interface DemoScenarioDefinition {
  id: DemoScenarioId;
  name: string;
  badge: string;
  badgeColor: string;
  targetApplicationId: string;
  targetApplicationName: string;
  targetVersion: string;
  overallScore: number;
  recommendation: "RELEASE" | "CONDITIONAL_RELEASE" | "REJECT";
  description: string;
}
