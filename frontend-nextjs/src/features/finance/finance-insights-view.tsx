"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Lightbulb, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/metric-card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { FinanceInsight, FinanceInsightsResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type FinanceInsightsViewProps = {
  tenantSlug: string;
  currency?: string;
};

const severityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  opportunity: "border-emerald-500/40 bg-emerald-500/5",
  info: "border-primary/30 bg-primary/5",
};

const severityBadge: Record<string, "warning" | "secondary" | "outline" | "default" | "success"> = {
  critical: "warning",
  warning: "secondary",
  opportunity: "success",
  info: "outline",
};

function InsightCard({ insight }: { insight: FinanceInsight }) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", severityStyles[insight.severity] ?? severityStyles.info)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{insight.title}</h3>
            <Badge variant={severityBadge[insight.severity] ?? "outline"}>{insight.severity}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{insight.message}</p>
        </div>
      </div>
      {insight.action ? (
        <p className="mt-3 text-sm font-medium text-foreground">Suggested action: {insight.action}</p>
      ) : null}
    </div>
  );
}

export function FinanceInsightsView({ tenantSlug, currency = "GHS" }: FinanceInsightsViewProps) {
  const [data, setData] = useState<FinanceInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const result = await createApiClient(getApiClientOptions()).get<{ data: FinanceInsightsResponse }>(
        `/${tenantSlug}/finance/insights?${params}`
      );
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load finance insights");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const forecast = data?.forecast;
  const metrics = data?.metrics;
  const insights = data?.insights ?? [];
  const topStaff = data?.highlights?.top_staff ?? [];
  const underperforming = data?.highlights?.underperforming_services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Finance Insights</h2>
          <p className="text-sm text-muted-foreground">
            Forecasts, warnings, and suggested actions based on your recent finance data.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="insights-from">From</Label>
            <Input id="insights-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="insights-to">To</Label>
            <Input id="insights-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Apply
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Projected month"
          value={formatMoney(forecast?.projected_month_revenue_cents ?? 0, currency)}
          icon={TrendingUp}
          hint={`MTD ${formatMoney(forecast?.mtd_revenue_cents ?? 0, currency)}`}
        />
        <MetricCard
          title="Refund rate"
          value={`${metrics?.refund_rate_percent ?? 0}%`}
          icon={AlertTriangle}
          hint="Of gross revenue"
        />
        <MetricCard
          title="Payroll ratio"
          value={`${metrics?.payroll_to_revenue_percent ?? 0}%`}
          icon={Users}
          hint="Payroll vs revenue"
        />
        <MetricCard
          title="Expense change"
          value={`${metrics?.expense_change_percent ?? 0}%`}
          icon={Lightbulb}
          hint="Vs prior period"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionHeading title="Insight feed" description="Prioritized by severity" />
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Loading insights…</p>
          ) : insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No insights for this period yet.</p>
          ) : (
            insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
          )}
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Busiest days</CardTitle>
              <CardDescription>Revenue by day of week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.busiest_days ?? []).map((day) => (
                <div key={day.day_of_week} className="flex items-center justify-between text-sm">
                  <span>{day.label}</span>
                  <span className="font-medium">{formatMoney(day.revenue_cents, currency)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Alert channels</CardTitle>
              <CardDescription>Notification placeholders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.alert_channels ?? []).map((channel) => (
                <div key={channel.channel} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{channel.label}</span>
                    <Badge variant={channel.enabled ? "default" : "outline"}>
                      {channel.enabled ? "On" : "Soon"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{channel.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Top revenue staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff revenue data yet.</p>
            ) : (
              topStaff.map((row) => (
                <div key={row.staff_id ?? row.name} className="flex items-center justify-between text-sm">
                  <span>{row.name}</span>
                  <span className="font-medium">{formatMoney(row.revenue_cents, currency)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Underperforming services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {underperforming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No underperforming services flagged.</p>
            ) : (
              underperforming.map((row) => (
                <div key={row.service_id} className="flex items-center justify-between text-sm">
                  <span>{row.name}</span>
                  <span className="text-muted-foreground">
                    avg {formatMoney(row.avg_revenue_cents, currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
