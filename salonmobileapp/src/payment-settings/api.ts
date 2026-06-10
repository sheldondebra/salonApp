import { createApiClient } from "@/api/client";
import type { TenantMtnMomoContext, TenantPaymentModeSettings } from "@/payment-settings/types";

export type PaymentSettingsAuth = {
  token: string;
  tenantSlug: string;
};

function client(auth: PaymentSettingsAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string): string {
  return `/${slug}${path}`;
}

export async function fetchPaymentSettings(auth: PaymentSettingsAuth): Promise<TenantPaymentModeSettings> {
  const res = await client(auth).get<{ data: TenantPaymentModeSettings }>(
    tenantPath(auth.tenantSlug, "/payment-settings")
  );
  return res.data;
}

export async function updatePaymentSettings(
  auth: PaymentSettingsAuth,
  payload: Partial<TenantPaymentModeSettings>
): Promise<TenantPaymentModeSettings> {
  const res = await client(auth).patch<{ data: TenantPaymentModeSettings }>(
    tenantPath(auth.tenantSlug, "/payment-settings"),
    payload
  );
  return res.data;
}

export async function fetchMtnMomoContext(auth: PaymentSettingsAuth): Promise<TenantMtnMomoContext> {
  const res = await client(auth).get<{ data: TenantMtnMomoContext }>(
    tenantPath(auth.tenantSlug, "/payment-providers/mtn-momo")
  );
  return res.data;
}

export async function requestMtnConnection(auth: PaymentSettingsAuth) {
  const res = await client(auth).post<{ message: string }>(
    tenantPath(auth.tenantSlug, "/payment-providers/mtn-momo/request-connection")
  );
  return res;
}

export async function runMtnHealthCheck(auth: PaymentSettingsAuth) {
  return client(auth).post<{ ok: boolean; message: string }>(
    tenantPath(auth.tenantSlug, "/payment-providers/mtn-momo/health-check")
  );
}
