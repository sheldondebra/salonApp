import type { ScheduleEvent } from "@/lib/api/types";

export type ScheduleCalendarFilters = {
  staffId: string;
  branchId: string;
  serviceId: string;
  status: string;
};

export function filterScheduleEvents(
  events: ScheduleEvent[],
  filters: ScheduleCalendarFilters,
  serviceNameById?: Map<string, string>
): ScheduleEvent[] {
  const serviceName =
    filters.serviceId && filters.serviceId !== "all"
      ? serviceNameById?.get(filters.serviceId)
      : undefined;

  return events.filter((event) => {
    if (filters.staffId !== "all" && event.staff_member_id !== Number(filters.staffId)) {
      return false;
    }
    if (filters.status !== "all" && event.type === "appointment" && event.status !== filters.status) {
      return false;
    }
    if (serviceName && event.type === "appointment") {
      const metaName = event.meta?.service_name;
      if (typeof metaName !== "string" || metaName !== serviceName) return false;
    }
    return true;
  });
}
