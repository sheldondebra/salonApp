import { createApiClient } from "@/api/client";
import type {
  AdminAppointment,
  AdminAppointmentsMeta,
  AdminDashboard,
  AdminTenant,
  PaginatedMeta,
  PlatformAlert,
} from "@/admin/types";

type Auth = { token: string };

function client(auth: Auth) {
  return createApiClient({ token: auth.token });
}

export async function fetchAdminDashboard(auth: Auth): Promise<AdminDashboard> {
  try {
    return await client(auth).get<AdminDashboard>("/admin/overview");
  } catch {
    return client(auth).get<AdminDashboard>("/admin/dashboard");
  }
}

export async function fetchAdminMetrics(auth: Auth): Promise<{
  cards: AdminDashboard["cards"];
  alerts: PlatformAlert[];
}> {
  return client(auth).get("/admin/metrics");
}

export type AppointmentFilter = "upcoming" | "today" | "past" | "all";

export async function fetchAdminAppointments(
  auth: Auth,
  params: { filter?: AppointmentFilter; q?: string; page?: number; per_page?: number } = {}
): Promise<{ data: AdminAppointment[]; meta: AdminAppointmentsMeta }> {
  const search = new URLSearchParams();
  if (params.filter) search.set("filter", params.filter);
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();

  return client(auth).get<{ data: AdminAppointment[]; meta: AdminAppointmentsMeta }>(
    `/admin/appointments${qs ? `?${qs}` : ""}`
  );
}

export async function fetchAdminAppointment(auth: Auth, uuid: string): Promise<AdminAppointment> {
  const res = await client(auth).get<{ data: AdminAppointment }>(`/admin/appointments/${uuid}`);
  return res.data;
}

export async function updateAdminAppointment(
  auth: Auth,
  uuid: string,
  body: { status?: string; notes?: string }
): Promise<AdminAppointment> {
  const res = await client(auth).patch<{ data: AdminAppointment }>(
    `/admin/appointments/${uuid}`,
    body
  );
  return res.data;
}

export async function fetchAdminTenants(
  auth: Auth,
  params: { q?: string; page?: number } = {}
): Promise<{ data: AdminTenant[]; meta: PaginatedMeta }> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();

  return client(auth).get<{ data: AdminTenant[]; meta: PaginatedMeta }>(
    `/admin/tenants${qs ? `?${qs}` : ""}`
  );
}
