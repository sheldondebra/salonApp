"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth/session";

type UseRequireAuthOptions = {
  /** Public routes (e.g. /{slug}/book) must not force login. */
  skip?: boolean;
};

/**
 * Redirects to /login when no API token is stored (client-side guard).
 * Returns `ready` once the client has confirmed a token exists.
 */
export function useRequireAuth(options?: UseRequireAuthOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const skip = options?.skip ?? false;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (skip) {
      setReady(true);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setReady(false);
      const returnTo =
        next && next.startsWith("/")
          ? next
          : pathname + (typeof window !== "undefined" ? window.location.search : "");
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    setReady(true);
  }, [router, next, skip, pathname]);

  return { ready: skip || ready };
}
