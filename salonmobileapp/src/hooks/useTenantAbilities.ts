import { useCallback, useEffect, useState } from "react";
import { createApiClient } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";

type AbilitiesResponse = {
  roles: string[];
  permissions: string[];
};

export function useTenantAbilities() {
  const auth = useTenantAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug })
      .get<AbilitiesResponse>(`/${auth.tenantSlug}/auth/abilities`)
      .then((res) => {
        if (!cancelled) setPermissions(res.permissions ?? []);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const can = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  return { permissions, loading, can };
}
