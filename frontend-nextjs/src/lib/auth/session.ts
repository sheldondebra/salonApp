"use client";

const TOKEN_KEY = "salonapp_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getApiClientOptions(tenantId?: number) {
  const token = getAuthToken();
  return { token: token ?? undefined, tenantId };
}
