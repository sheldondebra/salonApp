"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plug, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PlatformPaymentGatewaysOverview } from "@/lib/api/types";
import { AdminMtnMomoSettings } from "@/features/payments/admin-mtn-momo-settings";
import { PaymentGatewayCard } from "@/features/payments/payment-gateway-connected-panel";

export function AdminPaymentGatewaysHub() {
  const [overview, setOverview] = useState<PlatformPaymentGatewaysOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMtn, setExpandedMtn] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<PlatformPaymentGatewaysOverview>(
        "/admin/payment-gateways/overview"
      );
      setOverview(res);
      const mtn = res.gateways.find((g) => g.id === "mtn_momo");
      if (mtn && !mtn.connected) {
        setExpandedMtn(true);
      }
    } catch {
      toast.error("Could not load payment gateway status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!overview) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Payment gateway overview unavailable.
      </p>
    );
  }

  const mtnGateway = overview.gateways.find((g) => g.id === "mtn_momo");
  const cardGateways = overview.gateways.filter((g) => g.id !== "mtn_momo");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Connected"
          value={`${overview.summary.connected}/${overview.summary.total}`}
          hint="Live platform gateways"
          icon={Plug}
          className="border-emerald-500/20"
        />
        <MetricCard
          title="Configured"
          value={`${overview.summary.configured}/${overview.summary.total}`}
          hint="Credentials present"
          icon={CreditCard}
        />
        <MetricCard
          title="MTN MoMo"
          value={mtnGateway?.connected ? "Connected" : mtnGateway?.configured ? "Pending verify" : "Setup needed"}
          hint={mtnGateway?.environment ? `${mtnGateway.environment} · ${mtnGateway.currency ?? "GHS"}` : "Platform RTP"}
          icon={CreditCard}
        />
      </div>

      {mtnGateway ? (
        <PaymentGatewayCard gateway={mtnGateway}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Platform MTN configuration</p>
            <button
              type="button"
              onClick={() => setExpandedMtn((open) => !open)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {expandedMtn ? "Hide settings" : "Manage credentials"}
            </button>
          </div>
          {expandedMtn ? (
            <AdminMtnMomoSettings embedded onAccountChange={() => void load()} />
          ) : null}
        </PaymentGatewayCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {cardGateways.map((gateway) => (
          <PaymentGatewayCard key={gateway.id} gateway={gateway}>
            {!gateway.configured ? (
              <p className="text-sm text-muted-foreground">
                Add <code className="text-xs">{gateway.id === "paystack" ? "PAYSTACK_" : "FLUTTERWAVE_"}</code> keys
                to the server environment (.env) to enable this gateway for platform billing.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keys are loaded from the server environment. Restart the API after updating .env.
              </p>
            )}
          </PaymentGatewayCard>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh status
        </button>
      </div>
    </div>
  );
}
