import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { bookingApiBase } from "@/lib/api/tenant-path";
import type { BookingTimeSlot } from "@/lib/api/types";

type LoadAvailabilityParams = {
  tenantSlug: string;
  date: string;
  serviceIds: number[];
  staffMemberId?: number | null;
  locationId?: number | null;
  excludeAppointmentUuid?: string;
  includeReasons?: boolean;
};

export async function loadAvailabilitySlots({
  tenantSlug,
  date,
  serviceIds,
  staffMemberId,
  locationId,
  excludeAppointmentUuid,
  includeReasons = true,
}: LoadAvailabilityParams): Promise<BookingTimeSlot[]> {
  if (!serviceIds.length || !date) return [];

  const params = new URLSearchParams({ date });
  serviceIds.forEach((id, i) => params.append(`service_ids[${i}]`, String(id)));
  if (staffMemberId) params.set("staff_member_id", String(staffMemberId));
  if (locationId) params.set("location_id", String(locationId));
  if (excludeAppointmentUuid) params.set("exclude_appointment_uuid", excludeAppointmentUuid);
  if (includeReasons) params.set("include_reasons", "1");

  const apiBase = bookingApiBase(tenantSlug);
  const res = await createApiClient(getApiClientOptions()).get<{ data: BookingTimeSlot[] }>(
    `${apiBase}/availability?${params}`
  );

  return Array.isArray(res.data) ? res.data : [];
}
