"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient, ApiError } from "@/lib/api/client";
import { clearAuthToken, getApiClientOptions } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

type AbilitiesResponse = {
  roles: string[];
  permissions: string[];
};

export function usePlatformAbilities() {
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setSessionExpired(false);

    return createApiClient(getApiClientOptions())
      .get<AbilitiesResponse>("/auth/platform/abilities")
      .then((res) => {
        setRoles(res.roles ?? []);
        setPermissions(res.permissions ?? []);
      })
      .catch((err) => {
        setRoles([]);
        setPermissions([]);
        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken();
          setSessionExpired(true);
          setError("Your session expired. Please sign in again.");
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load platform permissions. Check that the API is running."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return {
    roles,
    permissions,
    loading,
    error,
    sessionExpired,
    reload: load,
    can: (permission: string | string[]) => hasPermission(permissions, permission),
  };
}
