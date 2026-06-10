import { createApiClient } from "@/api/client";
import type { BookingService } from "@/booking/types";
import type {
  CartLine,
  CheckoutTotals,
  CouponValidation,
  DiscountPolicy,
  PaymentMethod,
  PosClient,
  PosLocation,
  PosProduct,
  PosSummary,
  Sale,
  ServiceAddon,
} from "@/pos/types";

export type PosAuth = {
  token: string;
  tenantSlug: string;
};

function client(auth: PosAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string): string {
  return `/${slug}${path}`;
}

export async function fetchPosLocations(auth: PosAuth): Promise<PosLocation[]> {
  const res = await client(auth).get<{ data: PosLocation[] }>(
    tenantPath(auth.tenantSlug, "/locations?per_page=50")
  );
  return res.data ?? [];
}

export async function fetchPosServices(auth: PosAuth): Promise<BookingService[]> {
  const res = await client(auth).get<{ data: BookingService[] }>(
    tenantPath(auth.tenantSlug, "/services?per_page=100&is_active=1")
  );
  return res.data ?? [];
}

export async function fetchPosProducts(
  auth: PosAuth,
  locationId: number
): Promise<PosProduct[]> {
  const res = await client(auth).get<{ data: PosProduct[] }>(
    tenantPath(
      auth.tenantSlug,
      `/products?per_page=100&is_active=1&location_id=${locationId}`
    )
  );
  return res.data ?? [];
}

export async function fetchPosClients(auth: PosAuth): Promise<PosClient[]> {
  const res = await client(auth).get<{ data: PosClient[] }>(
    tenantPath(auth.tenantSlug, "/clients?per_page=100")
  );
  return res.data ?? [];
}

export async function fetchPosSummary(
  auth: PosAuth,
  locationId?: number
): Promise<PosSummary> {
  const qs = locationId ? `?location_id=${locationId}` : "";
  return client(auth).get<PosSummary>(tenantPath(auth.tenantSlug, `/pos/summary${qs}`));
}

export async function fetchRecentSales(auth: PosAuth, perPage = 15): Promise<Sale[]> {
  const res = await client(auth).get<{ data: Sale[] }>(
    tenantPath(auth.tenantSlug, `/sales?per_page=${perPage}`)
  );
  return res.data ?? [];
}

export async function fetchSale(auth: PosAuth, saleId: number): Promise<Sale> {
  const res = await client(auth).get<{ data: Sale }>(
    tenantPath(auth.tenantSlug, `/sales/${saleId}`)
  );
  return res.data;
}

export async function validatePosCoupon(
  auth: PosAuth,
  body: { code: string; amount_cents: number; service_ids: number[] }
): Promise<CouponValidation> {
  return client(auth).post<CouponValidation>(
    tenantPath(auth.tenantSlug, "/sales/validate-coupon"),
    body
  );
}

export type CompleteSalePayload = {
  location_id: number;
  client_user_id: number | null;
  appointment_uuid: string | null;
  items: Array<{
    type: "service" | "product" | "addon";
    service_id?: number;
    product_id?: number;
    service_addon_id?: number;
    quantity: number;
  }>;
  coupon_code: string | null;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  manual_discount_cents?: number;
  approval_request_uuid?: string | null;
  payment_method: PaymentMethod;
  notes: string | null;
};

export async function fetchDiscountPolicy(auth: PosAuth): Promise<DiscountPolicy> {
  const res = await client(auth).get<{ data: DiscountPolicy }>(
    tenantPath(auth.tenantSlug, "/finance/discount-policy")
  );
  return res.data;
}

export async function requestPosDiscountApproval(
  auth: PosAuth,
  body: {
    title: string;
    description: string;
    payload: Record<string, unknown>;
    is_urgent?: boolean;
  }
): Promise<{ uuid: string; status: string }> {
  const res = await client(auth).post<{ data: { uuid: string; status: string } }>(
    tenantPath(auth.tenantSlug, "/approvals"),
    { type: "pos_discount", ...body }
  );
  return res.data;
}

export async function findDiscountApprovalStatus(
  auth: PosAuth,
  uuid: string
): Promise<string | null> {
  const res = await client(auth).get<{ data: Array<{ uuid: string; status: string }> }>(
    tenantPath(auth.tenantSlug, "/approvals/inbox?type=pos_discount&per_page=50")
  );
  return res.data.find((row) => row.uuid === uuid)?.status ?? null;
}

export async function completeSale(auth: PosAuth, payload: CompleteSalePayload): Promise<Sale> {
  const res = await client(auth).post<{ data: Sale }>(
    tenantPath(auth.tenantSlug, "/sales"),
    payload
  );
  return res.data;
}

export function cartToSaleItems(cart: CartLine[]) {
  return cart.map((line) => ({
    type: line.type,
    service_id: line.type === "service" ? line.id : undefined,
    product_id: line.type === "product" ? line.id : undefined,
    service_addon_id: line.type === "addon" ? line.id : undefined,
    quantity: line.quantity,
  }));
}

export async function previewSaleTotals(
  auth: PosAuth,
  body: {
    location_id: number;
    items: ReturnType<typeof cartToSaleItems>;
    coupon_code?: string | null;
    tax_cents?: number;
    service_charge_cents?: number;
    tip_cents?: number;
  }
): Promise<CheckoutTotals> {
  const res = await client(auth).post<{ data: CheckoutTotals }>(
    tenantPath(auth.tenantSlug, "/sales/preview"),
    body
  );
  return res.data;
}

export async function fetchServiceAddons(auth: PosAuth, serviceId: number): Promise<ServiceAddon[]> {
  const res = await client(auth).get<{ data: ServiceAddon[] }>(
    tenantPath(auth.tenantSlug, `/services/${serviceId}/addons`)
  );
  return res.data ?? [];
}

export async function completeCheckoutSession(
  auth: PosAuth,
  sessionUuid: string,
  paymentMethod: PaymentMethod,
  options?: { manual_discount_cents?: number; approval_request_uuid?: string | null }
): Promise<Sale> {
  const res = await client(auth).post<{ data: { sale: Sale } }>(
    tenantPath(auth.tenantSlug, `/checkout-sessions/${sessionUuid}/complete`),
    {
      payment_method: paymentMethod,
      manual_discount_cents: options?.manual_discount_cents ?? 0,
      approval_request_uuid: options?.approval_request_uuid ?? null,
    }
  );
  return res.data.sale;
}
