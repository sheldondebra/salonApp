"use client";

import { useCallback, useEffect, useState } from "react";
import { MousePointerClick, Scissors, Star, Ticket } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { MarketplaceFeaturedOverview } from "@/lib/api/types";

type MarketplaceFeaturedViewProps = {
  tenantSlug: string;
};

export function MarketplaceFeaturedView({ tenantSlug }: MarketplaceFeaturedViewProps) {
  const [overview, setOverview] = useState<MarketplaceFeaturedOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<MarketplaceFeaturedOverview>(
        `/${tenantSlug}/marketplace/featured`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load featured placements");
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
        <MetricCard title="Active slots" value={String(overview?.summary.active_slots ?? 0)} icon={Star} />
        <MetricCard title="Waitlist" value={String(overview?.summary.waitlist_count ?? 0)} icon={Ticket} />
        <MetricCard
          title="CTR"
          value={`${Math.round(overview?.summary.click_through_rate_percent ?? 0)}%`}
          icon={MousePointerClick}
        />
        <MetricCard
          title="Bookings generated"
          value={String(overview?.summary.bookings_generated ?? 0)}
          icon={Scissors}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Featured marketplace placements</CardTitle>
          <CardDescription>
            Curated slots for salons that should appear higher in discovery surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "business_name",
                header: "Salon",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.business_name}</p>
                    <p className="text-xs text-muted-foreground">{row.city ?? "No city set"}</p>
                  </div>
                ),
              },
              { id: "slot", header: "Slot", cell: (row) => `#${row.slot}` },
              {
                id: "dates",
                header: "Dates",
                cell: (row) =>
                  row.starts_at && row.ends_at
                    ? `${new Date(row.starts_at).toLocaleDateString()} - ${new Date(row.ends_at).toLocaleDateString()}`
                    : "Rolling",
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
            data={overview?.placements ?? []}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Star}
            emptyTitle="No featured placements"
            emptyDescription="Featured marketplace campaigns will appear here once slots are assigned."
          />
        </CardContent>
      </Card>
    </div>
  );
}
