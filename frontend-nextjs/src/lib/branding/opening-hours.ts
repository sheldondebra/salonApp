export type OpeningHoursDay = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export const WEEKDAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function defaultOpeningHours(): OpeningHoursDay[] {
  return WEEKDAYS.map(({ key }) => ({
    day: key,
    open: "09:00",
    close: "18:00",
    closed: key === "sun",
  }));
}

export function normalizeOpeningHours(raw: unknown): OpeningHoursDay[] {
  if (!Array.isArray(raw)) return defaultOpeningHours();
  const byKey = new Map<string, OpeningHoursDay>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const day = String(o.day ?? "");
    if (!day) continue;
    byKey.set(day, {
      day,
      open: String(o.open ?? "09:00"),
      close: String(o.close ?? "18:00"),
      closed: Boolean(o.closed),
    });
  }
  return WEEKDAYS.map(({ key }) => {
    const existing = byKey.get(key);
    return (
      existing ?? {
        day: key,
        open: "09:00",
        close: "18:00",
        closed: key === "sun",
      }
    );
  });
}

export function formatHoursForDisplay(hours: OpeningHoursDay[]): string[] {
  const labelByKey = Object.fromEntries(WEEKDAYS.map((d) => [d.key, d.label]));
  return hours.map((h) => {
    const label = labelByKey[h.day] ?? h.day;
    if (h.closed) return `${label}: Closed`;
    return `${label}: ${formatTime12(h.open)} – ${formatTime12(h.close)}`;
  });
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}
