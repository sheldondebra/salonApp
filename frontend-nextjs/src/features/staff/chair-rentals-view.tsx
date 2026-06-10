"use client";

import { useCallback, useEffect, useState } from "react";
import { Armchair, DoorOpen, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { ChairRentalOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type ChairRentalsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function ChairRentalsView({ tenantSlug, currency = "GHS" }: ChairRentalsViewProps) {
  const [overview, setOverview] = useState<ChairRentalOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<ChairRentalOverview>(
        `/${tenantSlug}/chair-rentals`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load chair rentals");
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
        <MetricCard title="Active rentals" value={String(overview?.summary.active_rentals ?? 0)} icon={Armchair} />
        <MetricCard
          title="Monthly recurring"
          value={formatMoney(overview?.summary.monthly_recurring_cents ?? 0, currency)}
          icon={Wallet}
        />
        <MetricCard
          title="Occupancy"
          value={`${Math.round(overview?.summary.occupancy_rate_percent ?? 0)}%`}
          icon={DoorOpen}
        />
        <MetricCard
          title="Outstanding"
          value={formatMoney(overview?.summary.outstanding_cents ?? 0, currency)}
          icon={Receipt}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Chair rental agreements</CardTitle>
          <CardDescription>
            Track self-employed chair renters, billing cycles, and branch occupancy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "renter_name",
                header: "Renter",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.renter_name}</p>
                    <p className="text-xs text-muted-foreground">{row.chair_label}</p>
                  </div>
                ),
              },
              { id: "branch_name", header: "Branch", cell: (row) => row.branch_name ?? "—" },
              { id: "billing_cycle", header: "Billing", cell: (row) => row.billing_cycle },
              {
                id: "rent_cents",
                header: "Rent",
                className: "text-right",
                cell: (row) => formatMoney(row.rent_cents, currency),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.status === "active" ? "success" : "secondary"}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
            data={overview?.agreements ?? []}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Armchair}
            emptyTitle="No chair rental agreements"
            emptyDescription="Chair and booth rental contracts will appear here once configured."
          />
        </CardContent>
      </Card>
    </div>
  );
}
