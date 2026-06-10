"use client";

import { useCallback, useEffect, useState } from "react";
import { Percent, Receipt, Wallet, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { MarketplaceCommissionOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type MarketplaceCommissionsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function MarketplaceCommissionsView({
  tenantSlug,
  currency = "GHS",
}: MarketplaceCommissionsViewProps) {
  const [overview, setOverview] = useState<MarketplaceCommissionOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<MarketplaceCommissionOverview>(
        `/${tenantSlug}/marketplace/commissions`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load marketplace commissions");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending payout" value={formatMoney(overview?.summary.pending_cents ?? 0, currency)} icon={Wallet} />
        <MetricCard title="Paid out" value={formatMoney(overview?.summary.paid_cents ?? 0, currency)} icon={WalletCards} />
        <MetricCard title="Marketplace bookings" value={String(overview?.summary.bookings ?? 0)} icon={Receipt} />
        <MetricCard title="Average rate" value={`${Math.round(overview?.summary.average_rate ?? 0)}%`} icon={Percent} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Commission history</CardTitle>
          <CardDescription>
            Each marketplace conversion and the partner commission owed from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "partner_name",
                header: "Partner",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.partner_name}</p>
                    <p className="text-xs text-muted-foreground">{row.booking_reference}</p>
                  </div>
                ),
              },
              { id: "service_name", header: "Service", cell: (row) => row.service_name ?? "—" },
              { id: "rate", header: "Rate", cell: (row) => `${row.commission_rate}%` },
              {
                id: "gross_cents",
                header: "Gross",
                className: "text-right",
                cell: (row) => formatMoney(row.gross_cents, currency),
              },
              {
                id: "commission_cents",
                header: "Commission",
                className: "text-right",
                cell: (row) => formatMoney(row.commission_cents, currency),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.status === "paid" ? "success" : "secondary"}>{row.status}</Badge>
                ),
              },
            ]}
            data={overview?.records ?? []}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Receipt}
            emptyTitle="No marketplace commissions"
            emptyDescription="Commissions appear here after marketplace-generated bookings are completed."
          />
        </CardContent>
      </Card>
    </div>
  );
}
