"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/session";
import type { User } from "@/lib/api/types";

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    createApiClient({ token })
      .get<{ user: User }>("/me")
      .then((res) => {
        if (!cancelled) setUser(res.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
