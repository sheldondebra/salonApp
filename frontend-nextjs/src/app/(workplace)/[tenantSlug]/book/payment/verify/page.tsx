"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { bookingApiBase } from "@/lib/api/tenant-path";

function VerifyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = String(params.tenantSlug ?? "");
  const reference = searchParams.get("reference") ?? "";
  const appointmentUuid = searchParams.get("appointment") ?? "";

  const [status, setStatus] = useState<"loading" | "paid" | "failed">("loading");

  useEffect(() => {
    if (!reference || !tenantSlug) {
      setStatus("failed");
      return;
    }
    const base = bookingApiBase(tenantSlug);
    createApiClient(getApiClientOptions(undefined, tenantSlug))
      .get<{ paid: boolean }>(`${base}/payments/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => setStatus(res.paid ? "paid" : "failed"))
      .catch(() => setStatus("failed"));
  }, [reference, tenantSlug]);

  return (
    <Card className="mx-auto mt-16 max-w-md shadow-soft">
      <CardContent className="flex flex-col items-center py-10 text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="mt-4 text-muted-foreground">Confirming your payment…</p>
          </>
        ) : null}
        {status === "paid" ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Payment received</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your booking is confirmed.</p>
            <Button className="mt-6" asChild>
              <Link href={`/${tenantSlug}/book`}>Back to booking</Link>
            </Button>
          </>
        ) : null}
        {status === "failed" ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Payment not confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {reference
                ? "We could not verify this payment yet. Try again or contact the salon."
                : "Missing payment reference."}
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link
                href={
                  appointmentUuid
                    ? `/${tenantSlug}/book?retry=${appointmentUuid}`
                    : `/${tenantSlug}/book`
                }
              >
                Try again
              </Link>
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function BookingPaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto mt-16 max-w-md shadow-soft">
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </CardContent>
        </Card>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
