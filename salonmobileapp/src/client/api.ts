import { createApiClient, type MobileApiConfig } from "@/api/client";
import { tenantAccountBase } from "@/booking/api";

function client(config: MobileApiConfig) {
  return createApiClient(config);
}

function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export type ClientDiscoveryBusiness = {
  id: number | string;
  type: "business" | "staff" | "service";
  name: string;
  subtitle?: string | null;
  city?: string | null;
  rating?: number | null;
  distance_km?: number | null;
  featured?: boolean;
  favorite?: boolean;
  rebook_service_name?: string | null;
  categories?: string[];
};

export type ClientFavoriteRecord = {
  id: number | string;
  type: string;
  item_id: number | string;
  label: string;
  subtitle?: string | null;
};

export type ClientDiscoveryDashboard = {
  nearby: ClientDiscoveryBusiness[];
  recently_viewed: ClientDiscoveryBusiness[];
  favorites: ClientDiscoveryBusiness[];
};

export async function fetchClientDiscovery(
  config: MobileApiConfig,
  tenantSlug: string,
  params: { q?: string; featured?: boolean } = {}
): Promise<ClientDiscoveryDashboard> {
  const res = await client({ ...config, tenantSlug }).get<ClientDiscoveryDashboard | { data: ClientDiscoveryDashboard }>(
    `${tenantAccountBase(tenantSlug)}/discovery${buildQueryString(params)}`
  );
  return unwrapData(res);
}

export async function fetchClientFavorites(
  config: MobileApiConfig,
  tenantSlug: string
): Promise<ClientFavoriteRecord[]> {
  const res = await client({ ...config, tenantSlug }).get<{ data?: ClientFavoriteRecord[] } | ClientFavoriteRecord[]>(
    `${tenantAccountBase(tenantSlug)}/favorites`
  );
  if (Array.isArray(res)) return res;
  return Array.isArray(res.data) ? res.data : [];
}

export async function addClientFavorite(
  config: MobileApiConfig,
  tenantSlug: string,
  body: { type: string; id: number | string; label?: string; subtitle?: string | null }
): Promise<void> {
  await client({ ...config, tenantSlug }).post(`${tenantAccountBase(tenantSlug)}/favorites`, body);
}

export async function removeClientFavorite(
  config: MobileApiConfig,
  tenantSlug: string,
  type: string,
  id: number | string
): Promise<void> {
  await client({ ...config, tenantSlug }).delete(`${tenantAccountBase(tenantSlug)}/favorites/${type}/${id}`);
}

function unwrapData<T>(payload: T | { data: T }): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    (payload as { data?: T }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
