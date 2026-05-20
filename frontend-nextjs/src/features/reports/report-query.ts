import { format, subDays } from "date-fns";
import type { ReportFiltersState } from "./types";

export function defaultReportFilters(): ReportFiltersState {
  const to = new Date();
  const from = subDays(to, 29);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
    location_id: "",
    staff_id: "",
    service_id: "",
    status: "",
  };
}

export function reportFiltersToQuery(filters: ReportFiltersState): string {
  const params = new URLSearchParams();
  params.set("from", filters.from);
  params.set("to", filters.to);
  if (filters.location_id) params.set("location_id", filters.location_id);
  if (filters.staff_id) params.set("staff_id", filters.staff_id);
  if (filters.service_id) params.set("service_id", filters.service_id);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}
