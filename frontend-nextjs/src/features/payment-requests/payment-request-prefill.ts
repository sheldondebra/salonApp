import type { PaymentRequestReason, TenantInvoice } from "@/lib/api/types";

export type PaymentRequestPrefill = {
  customer_id?: number | null;
  customer_name?: string | null;
  phone?: string | null;
  email?: string | null;
  amount_cents?: number;
  currency?: string;
  reason?: PaymentRequestReason;
  description?: string | null;
  booking_id?: number | null;
  pos_sale_id?: number | null;
  sms_purchase_invoice_id?: number | null;
  invoice_id?: number | null;
  branch_id?: number | null;
  gateway?: "paystack" | "flutterwave";
};

export function bookingPaymentPrefill(appointment: {
  id: number;
  payment_status?: string | null;
  amount_due_cents?: number | null;
  deposit_paid_cents?: number | null;
  client?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  location?: { id: number } | null;
  service?: { name: string } | null;
}): PaymentRequestPrefill | null {
  if (appointment.payment_status === "paid") return null;

  const due = appointment.amount_due_cents ?? 0;
  const deposit = appointment.deposit_paid_cents ?? 0;
  const balance = Math.max(0, due - deposit);
  if (balance < 100) return null;

  const isDeposit = deposit > 0 && balance < due;

  return {
    customer_id: appointment.client?.id ?? null,
    customer_name: appointment.client?.name ?? null,
    phone: appointment.client?.phone ?? null,
    email: appointment.client?.email ?? null,
    amount_cents: balance,
    reason: isDeposit ? "deposit_payment" : "booking_payment",
    booking_id: appointment.id,
    branch_id: appointment.location?.id ?? null,
    description: appointment.service?.name
      ? `${appointment.service.name}${isDeposit ? " — balance" : ""}`
      : null,
  };
}

export function posSalePaymentPrefill(sale: {
  id: number;
  total_cents: number;
  currency?: string;
  payment_method?: string;
  client?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  location?: { id: number } | null;
  sale_number?: string | null;
}): PaymentRequestPrefill | null {
  if (sale.payment_method === "mobile_money" || sale.total_cents < 100) return null;

  return {
    customer_id: sale.client?.id ?? null,
    customer_name: sale.client?.name ?? null,
    phone: sale.client?.phone ?? null,
    email: sale.client?.email ?? null,
    amount_cents: sale.total_cents,
    currency: sale.currency,
    reason: "pos_sale",
    pos_sale_id: sale.id,
    branch_id: sale.location?.id ?? null,
    description: sale.sale_number ? `POS ${sale.sale_number}` : "POS sale",
  };
}

export function invoicePaymentPrefill(invoice: TenantInvoice): PaymentRequestPrefill | null {
  if (invoice.status === "paid" || invoice.status === "cancelled" || invoice.balance_due_cents < 100) {
    return null;
  }

  return {
    customer_id: invoice.customer?.id ?? null,
    customer_name: invoice.customer?.name ?? null,
    phone: invoice.customer?.phone ?? "",
    email: invoice.customer?.email ?? "",
    amount_cents: invoice.balance_due_cents,
    currency: invoice.currency,
    reason: "invoice_payment",
    invoice_id: invoice.id,
    branch_id: invoice.branch?.id ?? null,
    description: `Invoice ${invoice.invoice_number}`,
  };
}

export function clientPaymentPrefill(client: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}): PaymentRequestPrefill {
  return {
    customer_id: client.id,
    customer_name: client.name,
    phone: client.phone ?? "",
    email: client.email,
    reason: "other",
  };
}
