import { formatMoney } from "@/lib/pricing/format-money";
import type { Coupon } from "@/lib/api/types";

export function formatCouponValue(
  coupon: Pick<Coupon, "type" | "value">,
  currency = "GHS"
): string {
  if (coupon.type === "percent") {
    return `${coupon.value}%`;
  }
  return formatMoney(coupon.value, currency);
}

/** Fixed discounts are stored in cents; form input uses major currency units. */
export function fixedAmountToCents(majorUnits: number): number {
  return Math.max(1, Math.round(majorUnits * 100));
}

export function fixedAmountFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function couponStatusLabel(coupon: Coupon): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (!coupon.is_active) {
    return { label: "Inactive", variant: "secondary" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { label: "Expired", variant: "outline" };
  }
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { label: "Scheduled", variant: "outline" };
  }
  if (
    coupon.max_redemptions != null &&
    coupon.redemptions_count >= coupon.max_redemptions
  ) {
    return { label: "Used up", variant: "outline" };
  }
  return { label: "Active", variant: "default" };
}
