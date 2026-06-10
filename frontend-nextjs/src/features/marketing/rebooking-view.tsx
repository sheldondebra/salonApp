"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Repeat2, Scissors, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { RebookingOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type RebookingViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function RebookingView({ tenantSlug, currency = "GHS" }: RebookingViewProps) {
  const [overview, setOverview] = useState<RebookingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<RebookingOverview>(
        `/${tenantSlug}/marketing/rebooking`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load rebooking insights");
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
        <MetricCard title="Due clients" value={String(overview?.summary.due_clients ?? 0)} icon={CalendarClock} />
        <MetricCard title="Live campaigns" value={String(overview?.summary.auto_campaigns ?? 0)} icon={Repeat2} />
        <MetricCard title="Booked back" value={String(overview?.summary.booked_from_campaigns ?? 0)} icon={Scissors} />
        <MetricCard
          title="Projected revenue"
          value={formatMoney(overview?.summary.projected_revenue_cents ?? 0, currency)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Rebooking segments</CardTitle>
            <CardDescription>
              Segments help prioritize win-back efforts by value and urgency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.segments ?? []).map((segment) => (
              <div key={segment.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{segment.label}</p>
                    <p className="text-sm text-muted-foreground">{segment.clients} clients</p>
                  </div>
                  <Badge variant="outline">
                    {formatMoney(segment.projected_revenue_cents, currency)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Suggested outreach list</CardTitle>
            <CardDescription>
              Clients most likely to respond based on visit cadence and lifetime value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "client_name",
                  header: "Client",
                  mobilePrimary: true,
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.recommended_service ?? "General rebooking"}
                      </p>
                    </div>
                  ),
                },
                {
                  id: "suggested_date",
                  header: "Suggested date",
                  cell: (row) => row.suggested_date ?? "Flexible",
                },
                {
                  id: "likelihood",
                  header: "Likelihood",
                  cell: (row) => <Badge variant="secondary">{row.likelihood_label}</Badge>,
                },
                {
                  id: "value",
                  header: "LTV",
                  className: "text-right",
                  cell: (row) => formatMoney(row.lifetime_value_cents, currency),
                },
              ]}
              data={overview?.suggestions ?? []}
              rowKey={(row) => String(row.id)}
              loading={loading}
              emptyIcon={Repeat2}
              emptyTitle="No rebooking suggestions"
              emptyDescription="Once visit history is available, client win-back suggestions will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
