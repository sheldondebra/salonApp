"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { readBrowserCache } from "@/lib/api/browser-cache";
import { getStaffList } from "@/lib/api/staff-list-cache";
import {
  getStaffMeta,
  STAFF_META_CACHE_TTL_MS,
  type StaffMeta,
} from "@/lib/api/staff-meta-cache";
import type { Location, StaffMember, StaffStats } from "@/lib/api/types";

export type StaffDirectoryFilters = {
  search: string;
  activeFilter: "" | "active" | "inactive";
  bookableFilter: "" | "yes" | "no";
  locationFilter: string;
  statusFilter: string;
  titleFilter: string;
  page: number;
};

type ListMeta = { current_page: number; last_page: number; total: number };

function buildQueryString(filters: StaffDirectoryFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("per_page", "24");
  if (filters.search) params.set("q", filters.search);
  if (filters.activeFilter === "active") params.set("is_active", "1");
  if (filters.activeFilter === "inactive") params.set("is_active", "0");
  if (filters.bookableFilter === "yes") params.set("is_bookable", "1");
  if (filters.bookableFilter === "no") params.set("is_bookable", "0");
  if (filters.locationFilter) params.set("location_id", filters.locationFilter);
  if (filters.statusFilter) params.set("employment_status", filters.statusFilter);
  if (filters.titleFilter.trim()) params.set("title", filters.titleFilter.trim());
  return params.toString();
}

export function useStaffDirectory(tenantSlug: string, filters: StaffDirectoryFilters) {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const listQuery = useMemo(() => buildQueryString(filters), [filters]);
  const fetchGen = useRef(0);
  const metaLoadedFor = useRef<string | null>(null);

  useEffect(() => {
    const cached = readBrowserCache<StaffMeta>(`staff-meta:${tenantSlug}`, STAFF_META_CACHE_TTL_MS);
    if (cached) {
      setStats(cached.stats);
      setLocations(cached.locations);
      metaLoadedFor.current = tenantSlug;
    } else {
      metaLoadedFor.current = null;
    }
  }, [tenantSlug]);

  const refresh = useCallback(
    async (opts?: { force?: boolean; metaOnly?: boolean; listOnly?: boolean }) => {
      const force = opts?.force ?? false;
      const gen = ++fetchGen.current;

      const tasks: Promise<void>[] = [];

      if (!opts?.listOnly && (force || metaLoadedFor.current !== tenantSlug)) {
        tasks.push(
          getStaffMeta(tenantSlug, force).then(({ stats: s, locations: locs }) => {
            if (gen !== fetchGen.current) return;
            setStats(s);
            setLocations(locs);
            metaLoadedFor.current = tenantSlug;
          })
        );
      }

      if (!opts?.metaOnly) {
        tasks.push(
          getStaffList(tenantSlug, listQuery, force).then(({ items: rows, meta: m }) => {
            if (gen !== fetchGen.current) return;
            setItems(rows);
            setMeta(m);
          })
        );
      }

      try {
        await Promise.all(tasks);
      } catch (err) {
        if (gen !== fetchGen.current) return;
        if (!opts?.metaOnly) {
          setItems([]);
          setMeta(null);
        }
        toast.error(err instanceof ApiError ? err.message : "Failed to load staff");
      }
    },
    [tenantSlug, listQuery]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const delay = filters.search ? 350 : 0;
    const timer = window.setTimeout(() => {
      void run();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      fetchGen.current += 1;
    };
  }, [tenantSlug, listQuery, refresh, filters.search]);

  const invalidateAndRefresh = useCallback(async () => {
    metaLoadedFor.current = null;
    setLoading(true);
    try {
      await refresh({ force: true });
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return {
    items,
    meta,
    loading,
    stats,
    locations,
    refresh: invalidateAndRefresh,
  };
}
