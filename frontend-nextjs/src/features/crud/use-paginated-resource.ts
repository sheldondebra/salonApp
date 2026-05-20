"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  total: number;
};

type ListResponse<T> = {
  data: T[];
  meta?: PaginationMeta;
};

type UsePaginatedResourceOptions = {
  tenantSlug: string;
  path: string;
  search?: string;
  activeFilter?: "" | "active" | "inactive";
  page?: number;
};

export function usePaginatedResource<T>({
  tenantSlug,
  path,
  search = "",
  activeFilter = "",
  page = 1,
}: UsePaginatedResourceOptions) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("q", search);
    if (activeFilter === "active") params.set("is_active", "1");
    if (activeFilter === "inactive") params.set("is_active", "0");

    try {
      const res = await createApiClient(getApiClientOptions()).get<ListResponse<T>>(
        `/${tenantSlug}${path}?${params}`
      );
      setItems(Array.isArray(res.data) ? res.data : []);
      setMeta(res.meta ?? null);
    } catch (err) {
      setItems([]);
      setMeta(null);
      toast.error(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, path, search, activeFilter, page]);

  useEffect(() => {
    const t = setTimeout(() => load(), 280);
    return () => clearTimeout(t);
  }, [load]);

  return { items, meta, loading, reload: load };
}

export async function crudRequest<T>(
  tenantSlug: string,
  method: "post" | "patch" | "delete",
  path: string,
  body?: Record<string, unknown>
): Promise<T | void> {
  const client = createApiClient(getApiClientOptions());
  const url = `/${tenantSlug}${path}`;
  if (method === "post") return client.post<T>(url, body ?? {});
  if (method === "patch") return client.patch<T>(url, body ?? {});
  await client.delete(url);
}
