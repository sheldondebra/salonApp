import {
  fetchStaffList,
  fetchStaffLocations,
  fetchStaffStats,
  type StaffAuth,
} from "@/staff/api";
import type { StaffMember, StaffStats } from "@/staff/types";

export type StaffBundle = {
  stats: StaffStats;
  staff: StaffMember[];
  locations: { id: number; name: string }[];
};

const TTL_MS = 5 * 60 * 1000;
const memory = new Map<string, { at: number; data: StaffBundle }>();
const inflight = new Map<string, Promise<StaffBundle>>();

function bundleKey(auth: StaffAuth, query: string, bookableOnly: boolean) {
  return `${auth.tenantSlug}:${query}:${bookableOnly ? "1" : "0"}`;
}

export function invalidateStaffBundle(auth: StaffAuth) {
  const prefix = `${auth.tenantSlug}:`;
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export async function loadStaffBundle(
  auth: StaffAuth,
  query: string,
  bookableOnly: boolean,
  force = false
): Promise<StaffBundle> {
  const key = bundleKey(auth, query, bookableOnly);

  if (!force) {
    const hit = memory.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  }

  let pending = inflight.get(key);
  if (!pending) {
    pending = Promise.all([
      fetchStaffStats(auth),
      fetchStaffList(auth, {
        q: query.trim() || undefined,
        is_bookable: bookableOnly ? true : undefined,
        per_page: 100,
      }),
      fetchStaffLocations(auth),
    ])
      .then(([stats, listRes, locations]) => {
        const data: StaffBundle = {
          stats,
          staff: listRes.data ?? [],
          locations,
        };
        memory.set(key, { at: Date.now(), data });
        return data;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, pending);
  }

  return pending;
}
