import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "salonapp_auth_token";
const TENANT_SLUG_KEY = "salonapp_tenant_slug";

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredTenantSlug(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TENANT_SLUG_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTenantSlug(slug: string | null): Promise<void> {
  if (!slug) {
    await SecureStore.deleteItemAsync(TENANT_SLUG_KEY);
    return;
  }
  await SecureStore.setItemAsync(TENANT_SLUG_KEY, slug);
}
