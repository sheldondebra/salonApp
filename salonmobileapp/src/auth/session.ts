import { getStoredItem, removeStoredItem, setStoredItem } from "@/auth/storage";

const TOKEN_KEY = "salonapp_auth_token";
const TENANT_SLUG_KEY = "salonapp_tenant_slug";

export async function getAuthToken(): Promise<string | null> {
  return getStoredItem(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await setStoredItem(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await removeStoredItem(TOKEN_KEY);
}

export async function getStoredTenantSlug(): Promise<string | null> {
  return getStoredItem(TENANT_SLUG_KEY);
}

export async function setStoredTenantSlug(slug: string | null): Promise<void> {
  if (!slug) {
    await removeStoredItem(TENANT_SLUG_KEY);
    return;
  }
  await setStoredItem(TENANT_SLUG_KEY, slug);
}
