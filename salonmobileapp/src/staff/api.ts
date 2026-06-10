import { createApiClient } from "@/api/client";
import type {
  StaffCatalogService,
  StaffFormBody,
  StaffListParams,
  StaffLocation,
  StaffMember,
  StaffServiceAssignment,
  StaffStats,
  StaffWorkingHourDay,
  StaffWorkingHoursMeta,
} from "@/staff/types";

export type StaffAuth = { token: string; tenantSlug: string };

function client(auth: StaffAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string): string {
  return `/${slug}${path}`;
}

export async function fetchStaffStats(auth: StaffAuth): Promise<StaffStats> {
  const res = await client(auth).get<{ stats: StaffStats }>(
    tenantPath(auth.tenantSlug, "/staff-members/stats")
  );
  return res.stats;
}

export async function fetchStaffList(
  auth: StaffAuth,
  params: StaffListParams = {}
): Promise<{ data: StaffMember[]; meta?: { total?: number } }> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.is_active !== undefined) search.set("is_active", params.is_active ? "1" : "0");
  if (params.is_bookable !== undefined) search.set("is_bookable", params.is_bookable ? "1" : "0");
  if (params.location_id) search.set("location_id", String(params.location_id));
  if (params.employment_status) search.set("employment_status", params.employment_status);
  if (params.title) search.set("title", params.title);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();

  return client(auth).get<{ data: StaffMember[]; meta?: { total?: number } }>(
    tenantPath(auth.tenantSlug, `/staff-members${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchStaffMember(auth: StaffAuth, id: number): Promise<StaffMember> {
  const res = await client(auth).get<{ data: StaffMember }>(
    tenantPath(auth.tenantSlug, `/staff-members/${id}`)
  );
  return res.data;
}

export async function fetchStaffLocations(auth: StaffAuth): Promise<StaffLocation[]> {
  const res = await client(auth).get<{ data: StaffLocation[] }>(
    tenantPath(auth.tenantSlug, "/locations?per_page=50")
  );
  return res.data ?? [];
}

export async function createStaffMember(auth: StaffAuth, body: StaffFormBody): Promise<StaffMember> {
  const res = await client(auth).post<{ data: StaffMember }>(
    tenantPath(auth.tenantSlug, "/staff-members"),
    body
  );
  return res.data;
}

export async function updateStaffMember(
  auth: StaffAuth,
  id: number,
  body: Partial<StaffFormBody>
): Promise<StaffMember> {
  const res = await client(auth).patch<{ data: StaffMember }>(
    tenantPath(auth.tenantSlug, `/staff-members/${id}`),
    body
  );
  return res.data;
}

export async function deactivateStaffMember(auth: StaffAuth, id: number): Promise<void> {
  await client(auth).delete(tenantPath(auth.tenantSlug, `/staff-members/${id}`));
}

export async function fetchStaffServices(
  auth: StaffAuth,
  staffId: number
): Promise<StaffServiceAssignment[]> {
  const res = await client(auth).get<{ data: StaffServiceAssignment[] }>(
    tenantPath(auth.tenantSlug, `/staff-members/${staffId}/services`)
  );
  return (res.data ?? []).filter((r) => r.is_active);
}

export async function fetchStaffCatalogServices(auth: StaffAuth): Promise<StaffCatalogService[]> {
  const res = await client(auth).get<{ data: StaffCatalogService[] }>(
    tenantPath(auth.tenantSlug, "/services?per_page=100&is_active=1")
  );
  return res.data ?? [];
}

export async function bulkAssignStaffServices(
  auth: StaffAuth,
  staffId: number,
  serviceIds: number[]
): Promise<void> {
  await client(auth).put(tenantPath(auth.tenantSlug, `/staff-members/${staffId}/services/bulk`), {
    service_ids: serviceIds,
    replace: true,
  });
}

export async function removeStaffService(
  auth: StaffAuth,
  staffId: number,
  assignmentId: number
): Promise<void> {
  await client(auth).delete(
    tenantPath(auth.tenantSlug, `/staff-members/${staffId}/services/${assignmentId}`)
  );
}

export async function fetchStaffWorkingHours(
  auth: StaffAuth,
  staffId: number
): Promise<{ days: StaffWorkingHourDay[]; meta?: StaffWorkingHoursMeta }> {
  const res = await client(auth).get<{
    data: StaffWorkingHourDay[];
    meta?: StaffWorkingHoursMeta;
  }>(tenantPath(auth.tenantSlug, `/staff-members/${staffId}/working-hours`));
  return { days: res.data ?? [], meta: res.meta };
}

export async function saveStaffWorkingHours(
  auth: StaffAuth,
  staffId: number,
  body: {
    location_id?: number | null;
    days: Array<{
      day_of_week: number;
      is_working_day: boolean;
      start_time: string | null;
      end_time: string | null;
    }>;
  }
): Promise<{ days: StaffWorkingHourDay[]; meta?: StaffWorkingHoursMeta }> {
  const res = await client(auth).put<{
    data: StaffWorkingHourDay[];
    meta?: StaffWorkingHoursMeta;
  }>(tenantPath(auth.tenantSlug, `/staff-members/${staffId}/working-hours`), body);
  return { days: res.data ?? [], meta: res.meta };
}

export async function copyStaffWorkingHours(
  auth: StaffAuth,
  staffId: number,
  fromDay: number,
  toDays: number[]
): Promise<{ days: StaffWorkingHourDay[]; meta?: StaffWorkingHoursMeta }> {
  const res = await client(auth).post<{
    data: StaffWorkingHourDay[];
    meta?: StaffWorkingHoursMeta;
  }>(tenantPath(auth.tenantSlug, `/staff-members/${staffId}/working-hours/copy`), {
    from_day: fromDay,
    to_days: toDays,
  });
  return { days: res.data ?? [], meta: res.meta };
}
