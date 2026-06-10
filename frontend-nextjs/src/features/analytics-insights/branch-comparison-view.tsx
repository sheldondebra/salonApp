"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, CalendarRange, GitCompareArrows, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { BranchComparisonAnalytics } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

const CHART_COLORS = ["#ec4899", "#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b"];

type BranchComparisonViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function BranchComparisonView({
  tenantSlug,
  currency = "GHS",
}: BranchComparisonViewProps) {
  const [analytics, setAnalytics] = useState<BranchComparisonAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"revenue_cents" | "bookings" | "utilization_percent">(
    "revenue_cents"
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<BranchComparisonAnalytics>(
        `/${tenantSlug}/analytics/branch-comparison`
      );
      setAnalytics(result);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not load branch comparison analytics"
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const comparisonData = analytics?.branches ?? [];

  const trendData = useMemo(() => {
    const byLabel = new Map<string, Record<string, number | string>>();
    for (const point of analytics?.trend ?? []) {
      const current = byLabel.get(point.label) ?? { label: point.label };
      current[point.branch_name] = point.revenue_cents;
      byLabel.set(point.label, current);
    }
    return Array.from(byLabel.values());
  }, [analytics?.trend]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Branches compared"
          value={String(analytics?.summary.branches_compared ?? 0)}
          icon={Building2}
        />
        <MetricCard
          title="Total revenue"
          value={formatMoney(analytics?.summary.total_revenue_cents ?? 0, currency)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total bookings"
          value={String(analytics?.summary.total_bookings ?? 0)}
          icon={CalendarRange}
        />
        <MetricCard
          title="Top branch"
          value={analytics?.summary.top_branch_name ?? "—"}
          hint={`${Math.round(analytics?.summary.average_utilization_percent ?? 0)}% avg utilization`}
          icon={GitCompareArrows}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Branch comparison</CardTitle>
            <CardDescription>
              Compare revenue, bookings, and utilization side by side across branches.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "revenue_cents", label: "Revenue" },
              { id: "bookings", label: "Bookings" },
              { id: "utilization_percent", label: "Utilization" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setMetric(option.id as "revenue_cents" | "bookings" | "utilization_percent")
                }
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  metric === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[24rem]">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading charts...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="branch_name" />
                <YAxis
                  tickFormatter={(value) =>
                    metric === "revenue_cents"
                      ? formatMoney(Number(value), currency)
                      : metric === "utilization_percent"
                        ? `${value}%`
                        : String(value)
                  }
                />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(value ?? 0);
                    if (metric === "revenue_cents") return formatMoney(numericValue, currency);
                    if (metric === "utilization_percent") return `${numericValue}%`;
                    return numericValue;
                  }}
                />
                <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Revenue trend by branch</CardTitle>
            <CardDescription>
              Multi-branch trend lines help spot regions that are growing faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[24rem]">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading trend...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => formatMoney(Number(value), currency)} />
                  <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), currency)} />
                  <Legend />
                  {(analytics?.branches ?? []).map((branch, index) => (
                    <Line
                      key={branch.branch_name}
                      type="monotone"
                      dataKey={branch.branch_name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Branch scorecard</CardTitle>
            <CardDescription>Quick operating snapshot for each branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analytics?.branches ?? []).map((branch) => (
              <div
                key={branch.branch_id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{branch.branch_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {branch.bookings} bookings · {Math.round(branch.utilization_percent)}%
                      utilization
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary">
                    {formatMoney(branch.revenue_cents, currency)}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>Average ticket: {formatMoney(branch.average_ticket_cents, currency)}</p>
                  <p>Repeat rate: {Math.round(branch.repeat_rate_percent)}%</p>
                  <p>Review score: {branch.review_score ? branch.review_score.toFixed(1) : "—"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
