import { createApiClient } from "@/lib/api/client";
import {
  clearBrowserCache,
  clearBrowserCachePrefix,
  readBrowserCache,
  writeBrowserCache,
} from "@/lib/api/browser-cache";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Location, StaffStats } from "@/lib/api/types";

export type StaffMeta = {
  stats: StaffStats;
  locations: Location[];
};

/** In-memory + sessionStorage TTL (5 minutes). */
export const STAFF_META_CACHE_TTL_MS = 5 * 60 * 1000;

const memory = new Map<string, { at: number; data: StaffMeta }>();
const inflight = new Map<string, Promise<StaffMeta>>();

function cacheKey(tenantSlug: string) {
  return `staff-meta:${tenantSlug}`;
}

function readMemory(tenantSlug: string): StaffMeta | null {
  const hit = memory.get(tenantSlug);
  if (!hit || Date.now() - hit.at > STAFF_META_CACHE_TTL_MS) return null;
  return hit.data;
}

function writeMemory(tenantSlug: string, data: StaffMeta) {
  memory.set(tenantSlug, { at: Date.now(), data });
  writeBrowserCache(cacheKey(tenantSlug), data);
}

async function fetchStaffMeta(tenantSlug: string): Promise<StaffMeta> {
  const client = createApiClient(getApiClientOptions(undefined, tenantSlug));
  const [statsRes, locRes] = await Promise.all([
    client.get<{ stats: StaffStats }>(`/${tenantSlug}/staff-members/stats`),
    client.get<{ data: Location[] }>(`/${tenantSlug}/locations?per_page=50`),
  ]);
  return {
    stats: statsRes.stats,
    locations: Array.isArray(locRes.data) ? locRes.data : [],
  };
}

export function invalidateStaffMeta(tenantSlug: string) {
  memory.delete(tenantSlug);
  clearBrowserCache(cacheKey(tenantSlug));
}

export function invalidateAllStaffCaches(tenantSlug: string) {
  invalidateStaffMeta(tenantSlug);
  clearBrowserCachePrefix(`staff-list:${tenantSlug}:`);
}

/** Cached stats + locations; dedupes parallel callers. Pass force=true after mutations. */
export function getStaffMeta(tenantSlug: string, force = false): Promise<StaffMeta> {
  if (!force) {
    const mem = readMemory(tenantSlug);
    if (mem) return Promise.resolve(mem);
    const stored = readBrowserCache<StaffMeta>(cacheKey(tenantSlug), STAFF_META_CACHE_TTL_MS);
    if (stored) {
      memory.set(tenantSlug, { at: Date.now(), data: stored });
      return Promise.resolve(stored);
    }
  }

  let pending = inflight.get(tenantSlug);
  if (!pending) {
    pending = fetchStaffMeta(tenantSlug)
      .then((data) => {
        writeMemory(tenantSlug, data);
        return data;
      })
      .finally(() => {
        inflight.delete(tenantSlug);
      });
    inflight.set(tenantSlug, pending);
  }
  return pending;
}

export function getStaffStats(tenantSlug: string, force = false): Promise<StaffStats> {
  return getStaffMeta(tenantSlug, force).then((m) => m.stats);
}
