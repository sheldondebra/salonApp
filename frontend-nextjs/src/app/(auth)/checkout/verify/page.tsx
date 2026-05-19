"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

function VerifyPayment() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");
    if (!reference) {
      setStatus("failed");
      return;
    }

    createApiClient(getApiClientOptions())
      .get<{ paid: boolean; redirect?: string }>(`/billing/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => {
        if (res.paid) {
          setStatus("success");
          setTimeout(() => router.replace(res.redirect ?? "/onboarding"), 1500);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [searchParams, router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="absolute left-6 top-6">
        <AuthBackLink href="/checkout" label="Back to checkout" />
      </div>
      {status === "loading" ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Confirming your payment…</p>
        </>
      ) : null}
      {status === "success" ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h1 className="text-2xl font-semibold">Payment successful</h1>
          <p className="text-muted-foreground">Invoice and receipt sent to your email. Setting up onboarding…</p>
        </>
      ) : null}
      {status === "failed" ? (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold">Payment not confirmed</h1>
          <p className="text-muted-foreground">Try again or contact support if you were charged.</p>
          <Button asChild>
            <a href="/checkout">Back to checkout</a>
          </Button>
        </>
      ) : null}
    </div>
  );
}

export default function CheckoutVerifyPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin" />}>
      <VerifyPayment />
    </Suspense>
  );
}
