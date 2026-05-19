"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { plans } from "@/lib/pricing/plans";
import type { BillingPlan } from "@/lib/api/types";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "professional";
  const planMeta = plans.find((p) => p.id === planId);

  const [apiPlan, setApiPlan] = useState<BillingPlan | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [finalCents, setFinalCents] = useState(0);
  const [provider, setProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!getApiClientOptions().token) {
      router.replace(`/register?plan=${planId}&intent=salon`);
    }
  }, [planId, router]);

  useEffect(() => {
    createApiClient()
      .get<{ data: BillingPlan[] }>("/billing/plans")
      .then((res) => {
        const found = res.data.find((p) => p.id === planId);
        if (found) {
          setApiPlan(found);
          setFinalCents(found.price_cents);
        }
      })
      .catch(() => {});
  }, [planId]);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setValidating(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const res = await client.post<{
        valid: boolean;
        message?: string;
        discount_cents: number;
        final_amount_cents: number;
      }>("/billing/coupons/validate", { code: coupon, plan_id: planId });
      if (!res.valid) {
        toast.error(res.message ?? "Invalid coupon");
        setDiscountCents(0);
        setFinalCents(apiPlan?.price_cents ?? 0);
        return;
      }
      setDiscountCents(res.discount_cents);
      setFinalCents(res.final_amount_cents);
      toast.success("Coupon applied");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not validate coupon");
    } finally {
      setValidating(false);
    }
  }

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
        coupon_code: coupon || undefined,
        provider,
      });
      window.location.href = res.authorization_url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  const amount = (finalCents / 100).toFixed(2);

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
            <span>${((apiPlan?.price_cents ?? 0) / 100).toFixed(2)}</span>
          </div>
          {discountCents > 0 ? (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount</span>
              <span>-${(discountCents / 100).toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total due today</span>
            <span>${amount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coupon" className="flex items-center gap-1">
            <Tag className="h-4 w-4" /> Coupon code
          </Label>
          <div className="flex gap-2">
            <Input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME20" />
            <Button type="button" variant="outline" onClick={applyCoupon} disabled={validating}>
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Try WELCOME20 (20% off) or SAVE10 ($10 off)</p>
        </div>

        <div className="space-y-2">
          <Label>Payment provider</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={provider === "paystack" ? "default" : "outline"} onClick={() => setProvider("paystack")}>
              Paystack
            </Button>
            <Button type="button" variant={provider === "flutterwave" ? "default" : "outline"} onClick={() => setProvider("flutterwave")}>
              Flutterwave
            </Button>
          </div>
        </div>

        <Button className="w-full" onClick={pay} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {loading ? "Redirecting…" : `Pay $${amount}`}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Invoice and receipt will be emailed after payment.{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            Change plan
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
