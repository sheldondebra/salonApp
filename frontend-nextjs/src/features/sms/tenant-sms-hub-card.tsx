"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSectionHeader } from "@/features/settings/settings-ui";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { SmsPackageRow } from "@/features/sms/admin-sms-packages";

type WalletData = {
  balance_credits: number;
  total_used: number;
  total_purchased: number;
  low_balance_threshold: number;
  is_low_balance: boolean;
};

type TenantSmsHubCardProps = {
  tenantSlug: string;
  onWalletRefresh?: () => void;
};

function SmsPackagesGrid({
  tenantSlug,
  wallet,
  onWalletRefresh,
}: {
  tenantSlug: string;
  wallet: WalletData | null;
  onWalletRefresh?: () => void;
}) {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<SmsPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    createApiClient(getApiClientOptions(undefined, tenantSlug))
      .get<{ data: SmsPackageRow[] }>(`/${tenantSlug}/sms/packages`)
      .then((res) => setPackages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("sms_purchase") !== "1") return;
    const reference =
      searchParams.get("reference") ??
      searchParams.get("trxref") ??
      searchParams.get("tx_ref");
    if (!reference) return;

    let cancelled = false;
    createApiClient(getApiClientOptions(undefined, tenantSlug))
      .post<{ message: string }>(`/${tenantSlug}/sms/purchases/verify`, { reference })
      .then((res) => {
        if (cancelled) return;
        toast.success(res.message ?? "SMS credits added to your wallet.");
        onWalletRefresh?.();
        load();
        window.history.replaceState({}, "", `/${tenantSlug}/settings#notifications`);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof ApiError ? e.message : "Could not verify payment");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, tenantSlug, onWalletRefresh, load]);

  async function buyPackage(pkg: SmsPackageRow) {
    setBuyingId(pkg.id);
    try {
      const res = await createApiClient(getApiClientOptions(undefined, tenantSlug)).post<{
        data: {
          authorization_url: string | null;
          reference: string;
          demo_mode: boolean;
          credits: number;
        };
      }>(`/${tenantSlug}/sms/packages/${pkg.id}/purchase`, { provider: "paystack" });

      if (res.data.demo_mode) {
        toast.success(`${res.data.credits} SMS credits added to your wallet.`);
        onWalletRefresh?.();
        load();
        return;
      }

      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
        return;
      }

      toast.error("Payment could not be started");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium">No packages available</p>
        <p className="mt-1 text-xs text-muted-foreground">Contact support to enable SMS top-ups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Choose a pack to purchase</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {packages.map((pkg) => {
          const busy = buyingId === pkg.id;
          return (
            <div
              key={pkg.id}
              className={cn(
                "flex flex-col justify-between rounded-xl border p-4 transition-shadow",
                pkg.bonus_credits > 0
                  ? "border-primary/25 bg-primary/5"
                  : "border-border/60 bg-card"
              )}
            >
              <div>
                <p className="font-semibold leading-tight">{pkg.name}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-primary">
                  {pkg.total_credits.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">SMS credits</p>
                {pkg.bonus_credits > 0 ? (
                  <Badge className="mt-2 rounded-full text-xs">+{pkg.bonus_credits} bonus</Badge>
                ) : null}
              </div>
              <Button
                className="mt-4 w-full rounded-xl gap-2"
                disabled={busy}
                onClick={() => void buyPackage(pkg)}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {busy ? "Processing…" : `Buy · ${formatMoney(pkg.price_cents, pkg.currency)}`}
              </Button>
            </div>
          );
        })}
      </div>
      {wallet?.is_low_balance ? (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Low balance — top up to keep booking SMS running.
        </p>
      ) : null}
    </div>
  );
}

export function TenantSmsHubCard({ tenantSlug, onWalletRefresh }: TenantSmsHubCardProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await createApiClient(getApiClientOptions(undefined, tenantSlug)).get<{
        data: WalletData;
      }>(`/${tenantSlug}/sms/wallet`);
      setWallet(res.data);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const handleRefresh = useCallback(() => {
    void loadWallet(true);
    onWalletRefresh?.();
  }, [loadWallet, onWalletRefresh]);

  function scrollToLog() {
    document.getElementById("sms-delivery-log")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return <Skeleton className="h-56 rounded-2xl" />;
  }

  return (
    <Card className="rounded-2xl border-primary/15 shadow-soft">
      <SettingsSectionHeader
        icon={MessageSquare}
        title="SMS credits"
        description="Prepaid balance for confirmations, reminders, and marketing messages."
        action={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              disabled={refreshing}
              onClick={() => void handleRefresh()}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={scrollToLog}
            >
              View log
            </Button>
          </>
        }
      />
      <CardContent className="space-y-6 pt-0">
        {wallet ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:col-span-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {wallet.balance_credits.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Credits left</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-4 sm:col-span-2">
              <Badge variant="secondary" className="rounded-full font-normal">
                Used {wallet.total_used.toLocaleString()}
              </Badge>
              <Badge variant="secondary" className="rounded-full font-normal">
                Purchased {wallet.total_purchased.toLocaleString()}
              </Badge>
              {wallet.is_low_balance ? (
                <Badge variant="outline" className="gap-1 rounded-full border-amber-300 text-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  Low balance
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full border-emerald-300 text-emerald-800">
                  Healthy
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Wallet unavailable.{" "}
            <button type="button" className="font-medium text-primary underline" onClick={() => void handleRefresh()}>
              Try again
            </button>
          </div>
        )}

        <Suspense fallback={<Skeleton className="h-32 rounded-xl" />}>
          <SmsPackagesGrid tenantSlug={tenantSlug} wallet={wallet} onWalletRefresh={handleRefresh} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
