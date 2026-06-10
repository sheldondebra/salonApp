export const SLOT_REASON_LABELS: Record<string, string> = {
  booked: "Already booked",
  break: "Team break",
  time_off: "Time off",
  outside_hours: "Outside opening hours",
  buffer: "Turnover buffer",
  staff_unavailable: "Not available for this service",
};

export function slotReasonLabel(reason?: string | null): string | null {
  if (!reason) return null;
  return SLOT_REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}
