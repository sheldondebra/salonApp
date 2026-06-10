import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient } from "@/api/client";
import { resolveMobilePortal, resolveTenantSlug } from "@/auth/roles";
import {
  clearAuthToken,
  getAuthToken,
  getStoredTenantSlug,
  setAuthToken,
  setStoredTenantSlug,
} from "@/auth/session";
import type { ApiUser, LoginResponse, MeResponse, MobilePortal } from "@/auth/types";

type AuthState = {
  user: ApiUser | null;
  me: MeResponse | null;
  portal: MobilePortal | null;
  tenantSlug: string | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setActiveTenant: (slug: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const portal = useMemo(() => (user ? resolveMobilePortal(user, me ?? undefined) : null), [user, me]);

  const hydrateSession = useCallback(async (authToken: string) => {
    const client = createApiClient({ token: authToken });
    const meRes = await client.get<MeResponse>("/me");
    const storedSlug = await getStoredTenantSlug();
    const slug = resolveTenantSlug(meRes.user, meRes, storedSlug);

    setUser(meRes.user);
    setMe(meRes);
    setToken(authToken);
    setTenantSlug(slug);
    if (slug) await setStoredTenantSlug(slug);
  }, []);

  const refresh = useCallback(async () => {
    const existing = await getAuthToken();
    if (!existing) {
      setUser(null);
      setMe(null);
      setToken(null);
      setTenantSlug(null);
      return;
    }
    await hydrateSession(existing);
  }, [hydrateSession]);

  useEffect(() => {
    (async () => {
      try {
        const existing = await getAuthToken();
        if (existing) {
          await hydrateSession(existing);
        }
      } catch {
        await clearAuthToken();
        setUser(null);
        setMe(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrateSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const client = createApiClient();
      const res = await client.post<LoginResponse>("/auth/login", { email, password });
      await setAuthToken(res.token);
      await hydrateSession(res.token);
    },
    [hydrateSession]
  );

  const setActiveTenant = useCallback(async (slug: string) => {
    await setStoredTenantSlug(slug);
    setTenantSlug(slug);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await createApiClient({ token }).post("/auth/logout");
      }
    } catch {
      // ignore network errors on logout
    }
    await clearAuthToken();
    await setStoredTenantSlug(null);
    setUser(null);
    setMe(null);
    setToken(null);
    setTenantSlug(null);
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      me,
      portal,
      tenantSlug,
      token,
      loading,
      login,
      logout,
      refresh,
      setActiveTenant,
    }),
    [user, me, portal, tenantSlug, token, loading, login, logout, refresh, setActiveTenant]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
