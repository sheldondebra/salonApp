"use client";

import { useCallback, useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { getStaffList } from "@/lib/api/staff-list-cache";
import type { Location, Service, StaffMember, TenantClient } from "@/lib/api/types";

const LOOKUP_TTL_MS = 5 * 60 * 1000;

type LookupState<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
};

function emptyState<T>(): LookupState<T> {
  return { items: [], loading: true, error: null };
}

export function useEntityLookups(tenantSlug: string) {
  const [staff, setStaff] = useState<LookupState<StaffMember>>(emptyState);
  const [services, setServices] = useState<LookupState<Service>>(emptyState);
  const [branches, setBranches] = useState<LookupState<Location>>(emptyState);
  const [customers, setCustomers] = useState<LookupState<TenantClient>>(emptyState);

  const loadStaff = useCallback(
    async (force = false) => {
      setStaff((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await getStaffList(tenantSlug, "per_page=100&is_active=1", force);
        setStaff({ items: res.items, loading: false, error: null });
      } catch {
        setStaff({ items: [], loading: false, error: "Could not load staff" });
      }
    },
    [tenantSlug]
  );

  const loadServices = useCallback(
    async () => {
      setServices((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await createApiClient(getApiClientOptions(undefined, tenantSlug)).get<{
          data: Service[];
        }>(`/${tenantSlug}/services?per_page=100&is_active=1`);
        setServices({
          items: Array.isArray(res.data) ? res.data : [],
          loading: false,
          error: null,
        });
      } catch {
        setServices({ items: [], loading: false, error: "Could not load services" });
      }
    },
    [tenantSlug]
  );

  const loadBranches = useCallback(
    async () => {
      setBranches((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await createApiClient(getApiClientOptions(undefined, tenantSlug)).get<{
          data: Location[];
        }>(`/${tenantSlug}/locations?per_page=100&is_active=1`);
        setBranches({
          items: Array.isArray(res.data) ? res.data : [],
          loading: false,
          error: null,
        });
      } catch {
        setBranches({ items: [], loading: false, error: "Could not load branches" });
      }
    },
    [tenantSlug]
  );

  const searchCustomers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCustomers({ items: [], loading: false, error: null });
        return;
      }
      setCustomers((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await createApiClient(getApiClientOptions(undefined, tenantSlug)).get<{
          data: TenantClient[];
        }>(
          `/${tenantSlug}/clients?q=${encodeURIComponent(query.trim())}&per_page=20&is_active=1`
        );
        setCustomers({
          items: Array.isArray(res.data) ? res.data : [],
          loading: false,
          error: null,
        });
      } catch {
        setCustomers({ items: [], loading: false, error: "Could not search customers" });
      }
    },
    [tenantSlug]
  );

  useEffect(() => {
    void loadStaff();
    void loadServices();
    void loadBranches();
  }, [loadStaff, loadServices, loadBranches]);

  return {
    staff,
    services,
    branches,
    customers,
    refreshStaff: () => loadStaff(true),
    refreshServices: loadServices,
    refreshBranches: loadBranches,
    searchCustomers,
    cacheTtlMs: LOOKUP_TTL_MS,
  };
}
