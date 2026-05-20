"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { tenantApiBase } from "@/lib/api/tenant-path";
import type { Tenant, TenantBookingConfig } from "@/lib/api/types";
import { getApiClientOptions } from "@/lib/auth/session";

type TenantContextResponse = {
  tenant: Tenant;
  resolution?: string;
  booking?: TenantBookingConfig;
};

/**
 * Load tenant context by slug (workplace path) or by custom domain (no slug).
 */
export function useTenant(slug?: string | null) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [resolution, setResolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<TenantBookingConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createApiClient(getApiClientOptions());
    const path = `${tenantApiBase(slug)}/context`;

    client
      .get<TenantContextResponse>(path)
      .then((res) => {
        if (!cancelled) {
          setTenant(res.tenant);
          setResolution(res.resolution ?? null);
          setBooking(res.booking ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workspace");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tenant, booking, resolution, loading, error };
}
