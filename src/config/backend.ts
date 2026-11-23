/**
 * Hardcoded Google Apps Script Web App URL for static GitHub Pages deployment.
 * Replace the string below (or provide VITE_APPS_SCRIPT_URL at build time)
 * with your deployed Google Apps Script Web App URL.
 * This is intentionally kept out of the public UI so visitors cannot modify it.
 */
export const APPS_SCRIPT_WEB_APP_URL: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_APPS_SCRIPT_URL ?? '';
