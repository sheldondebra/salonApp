"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { bookingApiBase } from "@/lib/api/tenant-path";
import { ApplyCouponField } from "@/features/coupons/apply-coupon-field";
import { formatMoney } from "./booking-helpers";
import type { Appointment, TenantBookingConfig } from "@/lib/api/types";

type BookingPaymentStepProps = {
  tenantSlug: string;
  appointment: Appointment;
  booking?: TenantBookingConfig | null;
  clientEmail: string;
  clientName: string;
  onSkip?: () => void;
};

export function BookingPaymentStep({
  tenantSlug,
  appointment,
  booking,
  clientEmail,
  clientName,
  onSkip,
}: BookingPaymentStepProps) {
  const [provider, setProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [payCents, setPayCents] = useState(0);

  const currency = booking?.currency ?? "GHS";
  const requireFull = booking?.payments?.require_full_payment ?? false;
  const purpose = requireFull ? "booking" : "deposit";
  const dueCents = appointment.amount_due_cents ?? 0;
  const baseAmountCents = requireFull
    ? dueCents
    : Math.max(1, Math.round(dueCents * ((booking?.payments?.deposit_percent ?? 30) / 100)));

  const displayCents = payCents > 0 ? payCents : baseAmountCents;
  const clientOpts = getApiClientOptions(undefined, tenantSlug);
  const bookBase = bookingApiBase(tenantSlug);

  async function pay() {
    setLoading(true);
    try {
      const client = createApiClient(clientOpts);
      const res = await client.post<{ authorization_url: string }>(
        `${bookBase}/appointments/${appointment.uuid}/payments/checkout`,
        {
          purpose,
          provider,
          email: clientEmail,
          name: clientName,
          coupon_code: couponCode,
        }
      );
      window.location.href = res.authorization_url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start payment");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CreditCard className="h-4 w-4 text-accent" />
        {requireFull ? "Pay in full to confirm" : "Pay deposit to secure your slot"}
      </div>

      <ApplyCouponField
        validatePath={`${bookBase}/coupons/validate`}
        validateBody={{
          appointment_uuid: appointment.uuid,
          purpose,
          amount_cents: baseAmountCents,
        }}
        currency={currency}
        subtotalCents={baseAmountCents}
        clientOptions={clientOpts}
        onApplied={({ code, finalCents }) => {
          setCouponCode(code);
          setPayCents(finalCents);
        }}
        onCleared={() => {
          setCouponCode(undefined);
          setPayCents(0);
        }}
      />

      <div className="flex gap-2">
        {(["paystack", "flutterwave"] as const).map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={provider === p ? "default" : "outline"}
            onClick={() => setProvider(p)}
          >
            {p === "paystack" ? "Paystack" : "Flutterwave"}
          </Button>
        ))}
      </div>
      <Button type="button" className="w-full" disabled={loading} onClick={() => void pay()}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Pay ${formatMoney(displayCents, currency)}`
        )}
      </Button>
      {onSkip ? (
        <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onSkip}>
          Pay later at the salon
        </Button>
      ) : null}
    </div>
  );
}
