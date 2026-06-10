"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { ClientProfileData } from "@/lib/api/types";

export function useClientProfile(tenantSlug: string, clientId: number | null) {
  const [data, setData] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (clientId == null) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: ClientProfileData }>(
        `/${tenantSlug}/clients/${clientId}/profile`
      );
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load client profile");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(path: string, body: Record<string, unknown>) {
    await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/clients/${clientId}${path}`, body);
    toast.success("Saved");
    await load();
  }

  async function del(path: string) {
    await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/clients/${clientId}${path}`);
    toast.success("Removed");
    await load();
  }

  return { data, loading, error, reload: load, post, del };
}
