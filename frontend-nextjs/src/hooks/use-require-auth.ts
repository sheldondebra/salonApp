"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth/session";

/**
 * Redirects to /login when no API token is stored (client-side guard).
 */
export function useRequireAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    if (!getAuthToken()) {
      const returnTo =
        typeof window !== "undefined"
          ? next && next.startsWith("/")
            ? next
            : window.location.pathname + window.location.search
          : "/";
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [router, next]);
}
