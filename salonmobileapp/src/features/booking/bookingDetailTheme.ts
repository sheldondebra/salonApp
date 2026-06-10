import type { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export function statusTheme(status: string): {
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (status) {
    case "confirmed":
      return { color: "#059669", bg: "#D1FAE5", icon: "checkmark-circle" };
    case "completed":
      return { color: "#0369A1", bg: "#E0F2FE", icon: "checkmark-done-circle" };
    case "cancelled":
      return { color: colors.destructive, bg: "#FEE2E2", icon: "close-circle" };
    case "no_show":
      return { color: "#B45309", bg: "#FEF3C7", icon: "person-remove" };
    default:
      return { color: "#B45309", bg: "#FEF3C7", icon: "time" };
  }
}

export function statusActionIcon(status: BookingStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "confirmed":
      return "checkmark-circle-outline";
    case "completed":
      return "checkmark-done-outline";
    case "cancelled":
      return "close-circle-outline";
    case "no_show":
      return "person-remove-outline";
    default:
      return "hourglass-outline";
  }
}

export function paymentTheme(status?: string): { color: string; icon: keyof typeof Ionicons.glyphMap } {
  const s = (status ?? "").toLowerCase();
  if (s === "paid" || s === "completed") return { color: "#059669", icon: "card" };
  if (s === "partial") return { color: "#D97706", icon: "card-outline" };
  return { color: colors.mutedForeground, icon: "wallet-outline" };
}
