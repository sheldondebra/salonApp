import type { Appointment } from "@/booking/types";
import type { Sale } from "@/pos/types";
import type { ClientRow } from "@/workplace/api";

export type PaymentRequestPrefill = {
  customer_id?: number | null;
  customer_name?: string | null;
  phone?: string | null;
  email?: string | null;
  amount_cents?: number;
  currency?: string;
  reason?: string;
  description?: string | null;
  booking_id?: number | null;
  pos_sale_id?: number | null;
  invoice_id?: number | null;
  branch_id?: number | null;
  gateway?: "paystack" | "flutterwave" | "mtn_momo";
};

export function bookingPaymentPrefill(appointment: Appointment): PaymentRequestPrefill | null {
  if (appointment.payment_status === "paid") return null;
  const due = appointment.amount_due_cents ?? appointment.service?.price_cents ?? 0;
  const deposit = appointment.deposit_paid_cents ?? 0;
  const balance = Math.max(0, due - deposit);
  if (balance < 100) return null;
  const isDeposit = deposit > 0 && balance < due;
  return {
    customer_id: appointment.client?.id ?? null,
    customer_name: appointment.client?.name ?? null,
    phone: appointment.client?.phone ?? "",
    email: appointment.client?.email ?? null,
    amount_cents: balance,
    reason: isDeposit ? "deposit_payment" : "booking_payment",
    booking_id: appointment.id,
    branch_id: appointment.location?.id ?? null,
    description: appointment.service?.name ?? null,
  };
}

export function posSalePaymentPrefill(sale: Sale): PaymentRequestPrefill | null {
  if (sale.payment_method === "mobile_money" || sale.total_cents < 100) return null;
  return {
    customer_id: sale.client?.id ?? null,
    customer_name: sale.client?.name ?? null,
    phone: sale.client?.phone ?? "",
    email: sale.client?.email ?? null,
    amount_cents: sale.total_cents,
    currency: sale.currency,
    reason: "pos_sale",
    pos_sale_id: sale.id,
    branch_id: sale.location?.id ?? null,
    description: sale.sale_number ? `POS ${sale.sale_number}` : "POS sale",
  };
}

export function invoicePaymentPrefill(invoice: {
  id: number;
  status: string;
  balance_due_cents: number;
  currency: string;
  invoice_number: string;
  customer?: { id?: number; name?: string; email?: string | null; phone?: string | null } | null;
}): PaymentRequestPrefill | null {
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
    description: `Invoice ${invoice.invoice_number}`,
  };
}

export function clientPaymentPrefill(client: ClientRow): PaymentRequestPrefill {
  return {
    customer_id: client.id,
    customer_name: client.name,
    phone: client.phone ?? "",
    email: client.email ?? null,
    reason: "other",
  };
}

export function prefillFromParams(params: Record<string, string | string[] | undefined>): PaymentRequestPrefill {
  const num = (key: string) => {
    const v = params[key];
    const s = Array.isArray(v) ? v[0] : v;
    return s ? Number(s) : undefined;
  };
  const str = (key: string) => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : v) ?? undefined;
  };
  return {
    customer_id: num("customerId"),
    customer_name: str("customerName"),
    phone: str("phone"),
    email: str("email"),
    amount_cents: num("amountCents"),
    currency: str("currency"),
    reason: str("reason"),
    description: str("description"),
    booking_id: num("bookingId"),
    pos_sale_id: num("posSaleId"),
    invoice_id: num("invoiceId"),
    branch_id: num("branchId"),
    gateway: (str("gateway") as "paystack" | "flutterwave" | undefined) ?? "paystack",
  };
}
