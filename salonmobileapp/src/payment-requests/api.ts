import { createApiClient } from "@/api/client";
import type { PaymentRequest, PaymentRequestsMeta } from "@/payment-requests/types";

export type PaymentRequestAuth = {
  token: string;
  tenantSlug: string;
};

function client(auth: PaymentRequestAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string): string {
  return `/${slug}${path}`;
}

export async function fetchPaymentRequests(
  auth: PaymentRequestAuth,
  params: {
    page?: number;
    per_page?: number;
    status?: string;
    gateway?: string;
    reason?: string;
    date_from?: string;
    date_to?: string;
    q?: string;
  } = {}
): Promise<{ data: PaymentRequest[]; meta: PaymentRequestsMeta }> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.per_page) search.set("per_page", String(params.per_page));
  if (params.status) search.set("status", params.status);
  if (params.gateway) search.set("gateway", params.gateway);
  if (params.reason) search.set("reason", params.reason);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  if (params.q) search.set("q", params.q);
  const qs = search.toString();

  return client(auth).get<{ data: PaymentRequest[]; meta: PaymentRequestsMeta }>(
    tenantPath(auth.tenantSlug, `/payment-requests${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchPaymentRequest(
  auth: PaymentRequestAuth,
  id: number
): Promise<PaymentRequest> {
  const res = await client(auth).get<{ data: PaymentRequest }>(
    tenantPath(auth.tenantSlug, `/payment-requests/${id}`)
  );
  return res.data;
}

export async function createPaymentRequest(
  auth: PaymentRequestAuth,
  body: {
    customer_id?: number | null;
    booking_id?: number | null;
    pos_sale_id?: number | null;
    sms_purchase_invoice_id?: number | null;
    invoice_id?: number | null;
    branch_id?: number | null;
    amount_cents: number;
    currency?: string;
    phone: string;
    email?: string | null;
    gateway: string;
    reason: string;
    description?: string | null;
  }
): Promise<PaymentRequest> {
  const res = await client(auth).post<{ data: PaymentRequest; message?: string }>(
    tenantPath(auth.tenantSlug, "/payment-requests"),
    { ...body, payment_channel: "mobile_money" }
  );
  return res.data;
}

export async function verifyPaymentRequest(auth: PaymentRequestAuth, id: number): Promise<PaymentRequest> {
  const res = await client(auth).post<{ data: PaymentRequest; message?: string }>(
    tenantPath(auth.tenantSlug, `/payment-requests/${id}/verify`)
  );
  return res.data;
}

export async function cancelPaymentRequest(auth: PaymentRequestAuth, id: number): Promise<PaymentRequest> {
  const res = await client(auth).post<{ data: PaymentRequest; message?: string }>(
    tenantPath(auth.tenantSlug, `/payment-requests/${id}/cancel`)
  );
  return res.data;
}

export async function retryPaymentRequest(auth: PaymentRequestAuth, id: number): Promise<PaymentRequest> {
  const res = await client(auth).post<{ data: PaymentRequest; message?: string }>(
    tenantPath(auth.tenantSlug, `/payment-requests/${id}/retry`)
  );
  return res.data;
}
