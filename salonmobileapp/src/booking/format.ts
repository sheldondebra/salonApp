export function formatMoney(cents: number, currency = "GHS"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export function formatAppointmentWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatAppointmentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAppointmentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${formatAppointmentTime(startsAt)} – ${formatAppointmentTime(endsAt)}`;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function formatBookedVia(via?: string): string {
  if (!via) return "Staff";
  if (via === "online") return "Online booking";
  return via.replace(/_/g, " ");
}

export function dateOptions(count = 14): { value: string; label: string }[] {
  const items: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    items.push({ value, label });
  }
  return items;
}

export function normalizeAppointments(payload: unknown): import("@/booking/types").Appointment[] {
  if (Array.isArray(payload)) return payload as import("@/booking/types").Appointment[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: unknown }).data;
    if (Array.isArray(data)) return data as import("@/booking/types").Appointment[];
  }
  return [];
}
