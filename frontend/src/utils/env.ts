/**
 * QualiTrust AI — Environment Variables Helper
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  APP_ENV: import.meta.env.VITE_APP_ENV || "development",
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || "info",
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

