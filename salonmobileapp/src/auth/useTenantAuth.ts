import { useMemo } from "react";
import { useAuth } from "@/auth/AuthContext";

export type TenantAuth = { token: string; tenantSlug: string };

/** Stable auth object for effect/callback dependency arrays. */
export function useTenantAuth(): TenantAuth | null {
  const { token, tenantSlug } = useAuth();
  return useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug]
  );
}
