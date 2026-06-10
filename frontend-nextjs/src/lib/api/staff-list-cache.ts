import { createApiClient } from "@/lib/api/client";
import {
  readBrowserCache,
  writeBrowserCache,
} from "@/lib/api/browser-cache";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffMember } from "@/lib/api/types";
import { STAFF_META_CACHE_TTL_MS } from "@/lib/api/staff-meta-cache";

export type StaffListResult = {
  items: StaffMember[];
  meta: { current_page: number; last_page: number; total: number } | null;
};

const memory = new Map<string, { at: number; data: StaffListResult }>();
const inflight = new Map<string, Promise<StaffListResult>>();

function cacheKey(tenantSlug: string, queryString: string) {
  return `staff-list:${tenantSlug}:${queryString}`;
}

function readMemory(key: string): StaffListResult | null {
  const hit = memory.get(key);
  if (!hit || Date.now() - hit.at > STAFF_META_CACHE_TTL_MS) return null;
  return hit.data;
}

export function getStaffList(
  tenantSlug: string,
  queryString: string,
  force = false
): Promise<StaffListResult> {
  const key = cacheKey(tenantSlug, queryString);

  if (!force) {
    const mem = readMemory(key);
    if (mem) return Promise.resolve(mem);
    const stored = readBrowserCache<StaffListResult>(key, STAFF_META_CACHE_TTL_MS);
    if (stored) {
      memory.set(key, { at: Date.now(), data: stored });
      return Promise.resolve(stored);
    }
  }

  let pending = inflight.get(key);
  if (!pending) {
    pending = createApiClient(getApiClientOptions(undefined, tenantSlug))
      .get<{
        data: StaffMember[];
        meta?: { current_page: number; last_page: number; total: number };
      }>(`/${tenantSlug}/staff-members?${queryString}`)
      .then((res) => {
        const data: StaffListResult = {
          items: Array.isArray(res.data) ? res.data : [],
          meta: res.meta ?? null,
        };
        memory.set(key, { at: Date.now(), data });
        writeBrowserCache(key, data);
        return data;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, pending);
  }
  return pending;
}
