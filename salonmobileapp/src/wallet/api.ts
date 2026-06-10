import { createApiClient } from "@/api/client";
import type { TenantWallet, TenantWalletTransaction } from "@/wallet/types";

export type WalletAuth = { token: string; tenantSlug: string };

function client(auth: WalletAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string) {
  return `/${slug}${path}`;
}

export async function fetchWallet(auth: WalletAuth): Promise<TenantWallet> {
  const res = await client(auth).get<{ data: TenantWallet }>(tenantPath(auth.tenantSlug, "/wallet"));
  return res.data;
}

export async function fetchWalletTransactions(
  auth: WalletAuth,
  page = 1,
  perPage = 25
): Promise<{ data: TenantWalletTransaction[]; meta: { last_page: number; total: number } }> {
  return client(auth).get(tenantPath(auth.tenantSlug, `/wallet/transactions?page=${page}&per_page=${perPage}`));
}
