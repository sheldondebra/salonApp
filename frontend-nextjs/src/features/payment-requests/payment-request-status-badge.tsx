"use client";

import { Badge } from "@/components/ui/badge";
import type { PaymentRequestStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Paid",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function paymentRequestStatusVariant(
  status: PaymentRequestStatus | string
): "default" | "secondary" | "success" | "outline" | "warning" {
  if (status === "success") return "success";
  if (status === "failed" || status === "cancelled") return "warning";
  if (status === "expired") return "outline";
  if (status === "processing") return "default";
  return "secondary";
}

export function PaymentRequestStatusBadge({ status }: { status: PaymentRequestStatus | string }) {
  const label = STATUS_LABELS[status as PaymentRequestStatus] ?? status;

  return (
    <Badge variant={paymentRequestStatusVariant(status)} className="capitalize">
      {label}
    </Badge>
  );
}

export const PAYMENT_REQUEST_REASON_LABELS: Record<string, string> = {
  booking_payment: "Booking payment",
  deposit_payment: "Deposit",
  invoice_payment: "Invoice",
  pos_sale: "POS sale",
  sms_package_invoice: "SMS package",
  other: "Other",
};
