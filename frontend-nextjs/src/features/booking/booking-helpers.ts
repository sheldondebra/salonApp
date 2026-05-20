import { format, parseISO } from "date-fns";
import type { Appointment } from "@/lib/api/types";

export function formatMoney(cents: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export function formatAppointmentWhen(startsAt: string) {
  return format(parseISO(startsAt), "EEEE, MMM d 'at' h:mm a");
}

export function shortReference(uuid: string) {
  return uuid.slice(0, 8).toUpperCase();
}

export function normalizeAppointmentsFromResponse(payload: unknown): Appointment[] {
  if (Array.isArray(payload)) {
    return payload as Appointment[];
  }
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: unknown }).data;
    if (Array.isArray(data)) return data as Appointment[];
  }
  return [];
}
