"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

type AbilitiesResponse = {
  roles: string[];
  permissions: string[];
};

export function usePlatformAbilities() {
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    createApiClient(getApiClientOptions())
      .get<AbilitiesResponse>("/auth/platform/abilities")
      .then((res) => {
        if (!cancelled) {
          setRoles(res.roles ?? []);
          setPermissions(res.permissions ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
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
  }, []);

  return {
    roles,
    permissions,
    loading,
    can: (permission: string | string[]) => hasPermission(permissions, permission),
  };
}
