/**
 * Mobile API client foundation — wire to Expo/React Native when bootstrapped.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export type MobileApiConfig = {
  token?: string;
  tenantId?: string | number;
};

export function buildHeaders(config: MobileApiConfig = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  if (config.tenantId) {
    headers["X-Tenant-Id"] = String(config.tenantId);
  }

  return headers;
}
