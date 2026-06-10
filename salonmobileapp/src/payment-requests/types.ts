export type PaymentRequestStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "expired"
  | "cancelled";

export type PaymentRequest = {
  id: number;
  reference: string;
  amount_cents: number;
  currency: string;
  phone: string;
  email?: string | null;
  gateway: string;
  payment_channel: string;
  reason: string;
  description?: string | null;
  status: PaymentRequestStatus;
  provider_status?: string | null;
  external_reference?: string | null;
  transaction_uuid?: string | null;
  failed_reason?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  callback_received_at?: string | null;
  status_checked_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  requested_by?: { id: number; name: string; email?: string | null } | null;
  branch?: { id: number; name: string } | null;
  booking?: { id: number; uuid: string; starts_at?: string | null; service_name?: string | null } | null;
  pos_sale?: { id: number; uuid: string; sale_number?: string | null; total_cents?: number } | null;
};

export type PaymentRequestsMeta = {
  current_page: number;
  last_page: number;
  total: number;
  summary?: {
    pending: number;
    processing: number;
    success: number;
    failed: number;
    expired: number;
    cancelled: number;
  };
};

export const PAYMENT_REQUEST_REASON_LABELS: Record<string, string> = {
  booking_payment: "Booking payment",
  deposit_payment: "Deposit",
  invoice_payment: "Invoice",
  pos_sale: "POS sale",
  sms_package_invoice: "SMS package",
  other: "Other",
};

export const PAYMENT_REQUEST_STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Paid",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
};
