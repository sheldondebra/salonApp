"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { createApiClient } from "@/lib/api/client";
import { readBrowserCache, writeBrowserCache } from "@/lib/api/browser-cache";
import { getApiClientOptions } from "@/lib/auth/session";
import type { ScheduleEvent, StaffMember } from "@/lib/api/types";

const CACHE_TTL_MS = 60_000;

function cacheKey(
  tenantSlug: string,
  from: Date,
  to: Date,
  staffIds?: number[],
  locationId?: number
) {
  return `schedule:${tenantSlug}:${format(from, "yyyy-MM-dd")}:${format(to, "yyyy-MM-dd")}:${staffIds?.join(",") ?? "all"}:${locationId ?? "all"}`;
}

export function useScheduleRange(
  tenantSlug: string,
  from: Date,
  to: Date,
  staffIds?: number[],
  locationId?: number
) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const gen = useRef(0);

  const refresh = useCallback(
    async (force = false) => {
      const id = ++gen.current;
      const fromDay = startOfDay(from);
      const toDay = endOfDay(to);
      const key = cacheKey(tenantSlug, fromDay, toDay, staffIds, locationId);

      if (!force) {
        const cached = readBrowserCache<{ events: ScheduleEvent[]; staff: StaffMember[] }>(
          key,
          CACHE_TTL_MS
        );
        if (cached) {
          setEvents(cached.events);
          setStaff(cached.staff);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const client = createApiClient(getApiClientOptions(undefined, tenantSlug));
      const params = new URLSearchParams({
        from: format(fromDay, "yyyy-MM-dd"),
        to: format(toDay, "yyyy-MM-dd"),
      });
      if (staffIds?.length) params.set("staff_ids", staffIds.join(","));
      if (locationId) params.set("location_id", String(locationId));

      try {
        const [eventsRes, staffRes] = await Promise.all([
          client.get<{ data: ScheduleEvent[] }>(`/${tenantSlug}/schedule/events?${params}`),
          client.get<{ data: StaffMember[] }>(
            `/${tenantSlug}/staff-members?per_page=50&is_active=1&is_bookable=1`
          ),
        ]);
        if (id !== gen.current) return;
        const nextEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        let nextStaff = Array.isArray(staffRes.data) ? staffRes.data : [];
        if (staffIds?.length) {
          nextStaff = nextStaff.filter((s) => staffIds.includes(s.id));
        }
        if (locationId) {
          nextStaff = nextStaff.filter(
            (s) => !s.location_id || s.location_id === locationId
          );
        }
        setEvents(nextEvents);
        setStaff(nextStaff);
        writeBrowserCache(key, { events: nextEvents, staff: nextStaff });
      } catch {
        if (id !== gen.current) return;
        setEvents([]);
        setStaff([]);
      } finally {
        if (id === gen.current) setLoading(false);
      }
    },
    [tenantSlug, from, to, staffIds, locationId]
  );

  useEffect(() => {
    void refresh();
    return () => {
      gen.current += 1;
    };
  }, [refresh]);

  return { events, staff, loading, refresh };
}

export function invalidateScheduleCache(tenantSlug: string) {
  const prefix = `schedule:${tenantSlug}:`;
  if (typeof window === "undefined") return;
  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const k = sessionStorage.key(i);
    if (k?.includes(prefix)) sessionStorage.removeItem(k);
  }
}
