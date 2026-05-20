import { createApiClient, type MobileApiConfig } from "@/api/client";
import type {
  Appointment,
  BookingContext,
  BookingLocation,
  BookingService,
  BookingStaff,
  BookingTenant,
  BookingTimeSlot,
} from "@/booking/types";

export function bookingBase(tenantSlug: string): string {
  return `/${tenantSlug}/book`;
}

export function tenantAccountBase(tenantSlug: string): string {
  return `/${tenantSlug}/account`;
}

export async function fetchMyTenants(config: MobileApiConfig): Promise<BookingTenant[]> {
  const res = await createApiClient(config).get<{ data: BookingTenant[] }>("/account/tenants");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchBookingContext(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<BookingContext> {
  return createApiClient({ ...config, tenantSlug }).get<BookingContext>(`/${tenantSlug}/context`);
}

export async function fetchServices(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<BookingService[]> {
  const res = await createApiClient({ ...config, tenantSlug }).get<{ data: BookingService[] }>(
    `${bookingBase(tenantSlug)}/services`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStaff(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<BookingStaff[]> {
  const res = await createApiClient({ ...config, tenantSlug }).get<{ data: BookingStaff[] }>(
    `${bookingBase(tenantSlug)}/staff`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchLocations(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<{ locations: BookingLocation[]; multiple: boolean }> {
  const res = await createApiClient({ ...config, tenantSlug }).get<{
    data: BookingLocation[];
    meta?: { multiple_locations?: boolean };
  }>(`${bookingBase(tenantSlug)}/locations`);
  return {
    locations: Array.isArray(res.data) ? res.data : [],
    multiple: res.meta?.multiple_locations ?? false,
  };
}

export async function fetchAvailability(
  config: MobileApiConfig,
  tenantSlug: string,
  params: {
    date: string;
    serviceIds: number[];
    staffMemberId?: number | null;
    locationId?: number | null;
    excludeAppointmentUuid?: string;
  }
): Promise<BookingTimeSlot[]> {
  const qs = new URLSearchParams({ date: params.date });
  params.serviceIds.forEach((id, i) => qs.append(`service_ids[${i}]`, String(id)));
  if (params.staffMemberId) qs.set("staff_member_id", String(params.staffMemberId));
  if (params.locationId) qs.set("location_id", String(params.locationId));
  if (params.excludeAppointmentUuid) qs.set("exclude_appointment_uuid", params.excludeAppointmentUuid);

  const res = await createApiClient({ ...config, tenantSlug }).get<{ data: BookingTimeSlot[] }>(
    `${bookingBase(tenantSlug)}/availability?${qs}`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function createBooking(
  config: MobileApiConfig,
  tenantSlug: string,
  body: {
    service_ids: number[];
    staff_member_id?: number | null;
    location_id?: number | null;
    starts_at: string;
    notes?: string | null;
  }
): Promise<Appointment[]> {
  const res = await createApiClient({ ...config, tenantSlug }).post<{ appointments?: unknown }>(
    `${bookingBase(tenantSlug)}/appointments`,
    body
  );
  return normalizeAppointments(res.appointments);
}

export async function fetchBookingHistory(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<Appointment[]> {
  const res = await createApiClient({ ...config, tenantSlug }).get<{ data: unknown }>(
    `${tenantAccountBase(tenantSlug)}/bookings?per_page=30`
  );
  return normalizeAppointments(res.data);
}

export async function fetchBookingDetail(
  config: MobileApiConfig,
  tenantSlug: string,
  uuid: string
): Promise<Appointment> {
  const res = await createApiClient({ ...config, tenantSlug }).get<{ data: Appointment }>(
    `${tenantAccountBase(tenantSlug)}/bookings/${uuid}`
  );
  return res.data;
}

export async function cancelBooking(
  config: MobileApiConfig,
  tenantSlug: string,
  uuid: string
): Promise<Appointment> {
  const res = await createApiClient({ ...config, tenantSlug }).patch<{ data: Appointment }>(
    `${tenantAccountBase(tenantSlug)}/bookings/${uuid}`,
    { status: "cancelled" }
  );
  return res.data;
}

export async function rescheduleBooking(
  config: MobileApiConfig,
  tenantSlug: string,
  uuid: string,
  body: {
    starts_at: string;
    staff_member_id?: number | null;
    location_id?: number | null;
  }
): Promise<Appointment> {
  const res = await createApiClient({ ...config, tenantSlug }).patch<{ data: Appointment }>(
    `${tenantAccountBase(tenantSlug)}/bookings/${uuid}`,
    body
  );
  return res.data;
}

function normalizeAppointments(payload: unknown): Appointment[] {
  if (Array.isArray(payload)) return payload as Appointment[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: unknown }).data;
    if (Array.isArray(data)) return data as Appointment[];
  }
  return [];
}
