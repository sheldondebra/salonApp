"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/features/booking/booking-helpers";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { TenantWallet } from "@/lib/api/types";

export default function AdminTenantWalletsPage() {
  const [wallets, setWallets] = useState<TenantWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{
        data: TenantWallet[];
      }>("/admin/tenant-wallets?per_page=100");
      setWallets(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Tenant wallets" description="Schedelux payment wallet balances across salons.">
      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>All tenant wallets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No wallets yet — they are created when a tenant first opens the wallet page.</p>
            ) : (
              wallets.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{w.tenant?.name ?? `Tenant #${w.tenant_id}`}</p>
                    <p className="text-muted-foreground capitalize">{w.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(w.available_balance, w.currency)} available</p>
                    <p className="text-muted-foreground">{formatMoney(w.pending_balance, w.currency)} pending</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
