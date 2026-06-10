import { createApiClient } from "@/api/client";
import type { ScheduleEvent } from "@/schedule/types";

export type ScheduleAuth = { token: string; tenantSlug: string };

function client(auth: ScheduleAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

export async function fetchScheduleEvents(
  auth: ScheduleAuth,
  params: { from: string; to: string; staffIds?: number[]; locationId?: number }
): Promise<ScheduleEvent[]> {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  if (params.staffIds?.length) search.set("staff_ids", params.staffIds.join(","));
  if (params.locationId) search.set("location_id", String(params.locationId));

  const res = await client(auth).get<{ data: ScheduleEvent[] }>(
    `/${auth.tenantSlug}/schedule/events?${search}`
  );
  return Array.isArray(res.data) ? res.data : [];
}
