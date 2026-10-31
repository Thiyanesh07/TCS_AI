/**
 * QualiTrust AI — Environment Variables Helper
 */

function checkDemoMode(): boolean {
  if (typeof window !== "undefined") {
    const urlParam = new URLSearchParams(window.location.search).get("demo");
    if (urlParam === "true") return true;
    if (urlParam === "false") return false;

    const stored = window.localStorage.getItem("qualitrust_demo_mode");
    if (stored === "true") return true;
    if (stored === "false") return false;
  }
  return import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_DEMO_MODE === true;
}

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  APP_ENV: import.meta.env.VITE_APP_ENV || "development",
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || "info",
  DEMO_MODE: checkDemoMode(),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

export function isDemoMode(): boolean {
  return checkDemoMode();
}

export function setDemoModeOverride(enabled: boolean | null): void {
  if (typeof window === "undefined") return;
  if (enabled === null) {
    window.localStorage.removeItem("qualitrust_demo_mode");
  } else {
    window.localStorage.setItem("qualitrust_demo_mode", enabled ? "true" : "false");
  }
  // Refresh page to apply global mode switch cleanly
  window.location.reload();
}
