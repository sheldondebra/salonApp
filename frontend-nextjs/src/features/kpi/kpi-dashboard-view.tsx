"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Target, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { KpiDashboard } from "@/lib/api/types";

type KpiDashboardViewProps = {
  tenantSlug: string;
  currency?: string;
};

function formatKpiValue(actual: number, unit: string, currency: string) {
  if (unit === "currency") return formatMoney(Math.round(actual), currency);
  if (unit === "percent") return `${actual}%`;
  return String(actual);
}

export function KpiDashboardView({ tenantSlug, currency = "GHS" }: KpiDashboardViewProps) {
  const [dashboard, setDashboard] = useState<KpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<KpiDashboard>(
        `/${tenantSlug}/kpi-targets`
      );
      setDashboard(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load KPI targets");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(
    () =>
      (dashboard?.targets ?? []).map((target) => ({
        label: target.label,
        progress: target.progress_percent,
      })),
    [dashboard]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Targets" value={String(dashboard?.summary.targets ?? 0)} icon={Target} />
        <MetricCard title="On track" value={String(dashboard?.summary.on_track ?? 0)} icon={TrendingUp} />
        <MetricCard title="At risk" value={String(dashboard?.summary.at_risk ?? 0)} icon={TrendingDown} />
        <MetricCard title="Average progress" value={`${Math.round(dashboard?.summary.average_progress_percent ?? 0)}%`} icon={Target} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>KPI dashboard</CardTitle>
            <CardDescription>Track current performance against the goals set for this period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(dashboard?.targets ?? []).map((target) => (
              <div key={target.id} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{target.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatKpiValue(target.actual_value, target.unit, currency)} of{" "}
                      {formatKpiValue(target.target_value, target.unit, currency)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{Math.round(target.progress_percent)}%</p>
                    <p className="text-muted-foreground">{target.period_label || "Current period"}</p>
                  </div>
                </div>
                <Progress value={Math.max(0, Math.min(100, target.progress_percent))} className="mt-4" />
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{target.owner_name || "Whole business"}</span>
                  <span>
                    {target.trend && target.trend >= 0 ? "+" : ""}
                    {target.trend ?? 0}% trend
                  </span>
                </div>
              </div>
            ))}
            {!loading && (dashboard?.targets.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No KPI targets configured yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Progress by KPI</CardTitle>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
