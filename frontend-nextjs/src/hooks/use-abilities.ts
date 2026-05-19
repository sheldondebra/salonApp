"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

type AbilitiesResponse = {
  roles: string[];
  permissions: string[];
};

export function useAbilities(tenantSlug: string) {
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    createApiClient(getApiClientOptions())
      .get<AbilitiesResponse>(`/${tenantSlug}/auth/abilities`)
      .then((res) => {
        if (!cancelled) {
          setRoles(res.roles ?? []);
          setPermissions(res.permissions ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load permissions");
          setRoles([]);
          setPermissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  return {
    roles,
    permissions,
    loading,
    error,
    can: (permission: string | string[]) => hasPermission(permissions, permission),
  };
}
