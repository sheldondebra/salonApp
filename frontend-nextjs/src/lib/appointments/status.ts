import type { AppointmentStatus } from "@/lib/api/types";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  "warning" | "default" | "success" | "secondary" | "outline"
> = {
  pending: "warning",
  confirmed: "default",
  completed: "success",
  cancelled: "secondary",
  no_show: "outline",
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}
