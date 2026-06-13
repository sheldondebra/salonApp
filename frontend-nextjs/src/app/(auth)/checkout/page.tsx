"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApplyCouponField } from "@/features/coupons/apply-coupon-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { loginHref, registerHref } from "@/lib/auth/auth-flow-links";
import { formatMoney } from "@/lib/pricing/format-money";
import { plans } from "@/lib/pricing/plans";
import type { BillingPlan } from "@/lib/api/types";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "professional";
  const planMeta = plans.find((p) => p.id === planId);

  const [apiPlan, setApiPlan] = useState<BillingPlan | null>(null);
  const [currency, setCurrency] = useState("GHS");
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [discountCents, setDiscountCents] = useState(0);
  const [finalCents, setFinalCents] = useState(0);
  const [provider, setProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getApiClientOptions().token) {
      router.replace(
        loginHref({
          plan: planId,
          intent: "salon",
          next: `/checkout?plan=${encodeURIComponent(planId)}`,
        })
      );
      return;
    }
    setAuthChecked(true);
  }, [planId, router]);

  useEffect(() => {
    createApiClient()
      .get<{ data: BillingPlan[]; currency?: string }>("/billing/plans")
      .then((res) => {
        if (res.currency) setCurrency(res.currency);
        const found = res.data.find((p) => p.id === planId);
        if (found) {
          setApiPlan(found);
          setFinalCents(found.price_cents);
        }
      })
      .catch(() => {});
  }, [planId]);

  async function pay() {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const res = await client.post<{
        authorization_url: string;
        reference: string;
        demo_mode?: boolean;
      }>("/billing/checkout", {
        plan_id: planId,
        coupon_code: couponCode,
        provider,
      });
      window.location.href = res.authorization_url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  const amountLabel = formatMoney(finalCents, currency);

  if (!authChecked) {
    return (
      <AuthLayout title="Complete your subscription" subtitle="Checking your session…">
        <p className="py-8 text-center text-sm text-muted-foreground">One moment…</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      back={{
        href: `/register?plan=${planId}&intent=salon`,
        label: "Back to registration",
      }}
      title="Complete your subscription"
      subtitle="Secure payment via Paystack or Flutterwave."
    >
      <Card className="mb-6 shadow-soft">
        <CardHeader>
          <CardTitle>{planMeta?.name ?? planId} plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(apiPlan?.price_cents ?? 0, currency)}</span>
          </div>
          {discountCents > 0 ? (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount</span>
              <span>-{formatMoney(discountCents, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total due today</span>
            <span>{amountLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <ApplyCouponField
          key={planId}
          validatePath="/billing/coupons/validate"
          validateBody={{ plan_id: planId }}
          currency={currency}
          subtotalCents={apiPlan?.price_cents ?? 0}
          clientOptions={getApiClientOptions()}
          onApplied={({ code, discountCents: discount, finalCents: final }) => {
            setCouponCode(code);
            setDiscountCents(discount);
            setFinalCents(final);
          }}
          onCleared={() => {
            setCouponCode(undefined);
            setDiscountCents(0);
            setFinalCents(apiPlan?.price_cents ?? 0);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Try WELCOME20 (20% off) or SAVE10 (fixed discount).
        </p>

        <div className="space-y-2">
          <Label>Payment provider</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={provider === "paystack" ? "default" : "outline"}
              onClick={() => setProvider("paystack")}
            >
              Paystack
            </Button>
            <Button
              type="button"
              variant={provider === "flutterwave" ? "default" : "outline"}
              onClick={() => setProvider("flutterwave")}
            >
              Flutterwave
            </Button>
          </div>
        </div>

        <Button className="w-full" onClick={pay} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {loading ? "Redirecting…" : `Pay ${amountLabel}`}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Invoice and receipt will be emailed after payment.{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            Change plan
          </Link>
          {" · "}
          <Link
            href={registerHref({ plan: planId, intent: "salon" })}
            className="text-accent hover:underline"
          >
            Use a different account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Loading checkout…</p>}>
      <CheckoutForm />
    </Suspense>
  );
}
