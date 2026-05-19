"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { setAuthToken } from "@/lib/auth/session";
import { createApiClient } from "@/lib/api/client";
import { redirectPathAfterAuth } from "@/lib/auth/redirect-after-auth";
import type { User } from "@/lib/api/types";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      setError(err);
      return;
    }

    if (!token) {
      setError("Missing authentication token");
      return;
    }

    setAuthToken(token);

    createApiClient({ token })
      .get<{ user: User }>("/me")
      .then((res) => router.replace(redirectPathAfterAuth(res.user)))
      .catch(() => router.replace("/luxe-bloom/account/profile"));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AuthBackLink href="/login" label="Back to sign in" className="mb-2" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
