"use client";

import { useCallback, useEffect, useState } from "react";
import { MailWarning, RotateCcw, Send, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { AbandonedBookingsOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type AbandonedBookingsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function AbandonedBookingsView({
  tenantSlug,
  currency = "GHS",
}: AbandonedBookingsViewProps) {
  const [overview, setOverview] = useState<AbandonedBookingsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<AbandonedBookingsOverview>(
        `/${tenantSlug}/marketing/abandoned-bookings`
      );
      setOverview(result);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not load abandoned booking campaigns"
      );
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
        <MetricCard
          title="Open abandoned"
          value={String(overview?.summary.open_abandoned ?? 0)}
          icon={MailWarning}
        />
        <MetricCard
          title="Recovered bookings"
          value={String(overview?.summary.recovered_bookings ?? 0)}
          icon={RotateCcw}
        />
        <MetricCard
          title="Recovery rate"
          value={`${Math.round(overview?.summary.recovery_rate_percent ?? 0)}%`}
          icon={Send}
        />
        <MetricCard
          title="Recovered revenue"
          value={formatMoney(overview?.summary.revenue_recovered_cents ?? 0, currency)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Active recovery campaigns</CardTitle>
            <CardDescription>
              Campaigns that nudge clients back after they leave the booking funnel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.campaigns ?? []).map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.channel} · trigger after {campaign.trigger_minutes} minutes
                    </p>
                  </div>
                  <Badge variant={campaign.status === "live" ? "success" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Sent: {campaign.sent_count}</p>
                  <p>Recovered: {campaign.recovered_bookings}</p>
                  <p>Recovery: {Math.round(campaign.recovery_rate_percent)}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Live queue</CardTitle>
            <CardDescription>Clients currently eligible for rescue reminders.</CardDescription>
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
                      <p className="text-xs text-muted-foreground">{row.service_name ?? "Any service"}</p>
                    </div>
                  ),
                },
                { id: "branch_name", header: "Branch", cell: (row) => row.branch_name ?? "—" },
                {
                  id: "status",
                  header: "Status",
                  cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
                },
                {
                  id: "value",
                  header: "Value",
                  className: "text-right",
                  cell: (row) => formatMoney(row.estimated_value_cents, currency),
                },
              ]}
              data={overview?.queue ?? []}
              rowKey={(row) => String(row.id)}
              loading={loading}
              emptyIcon={MailWarning}
              emptyTitle="No abandoned bookings"
              emptyDescription="Your recovery queue will appear here when clients leave before confirming."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void load()}>
          Refresh campaigns
        </Button>
      </div>
    </div>
  );
}
