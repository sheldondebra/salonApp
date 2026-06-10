"use client";

import { useScheduleRange } from "@/features/schedule/use-schedule-range";

/** Fetch schedule events for a single calendar day. */
export function useScheduleDay(
  tenantSlug: string,
  date: Date,
  staffIds?: number[],
  locationId?: number
) {
  return useScheduleRange(tenantSlug, date, date, staffIds, locationId);
}

export { invalidateScheduleCache } from "@/features/schedule/use-schedule-range";
