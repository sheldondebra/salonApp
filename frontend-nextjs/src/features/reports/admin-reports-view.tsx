"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
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
import { Building2, CreditCard, MessageSquare, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError, createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import { ReportsFilters } from "./reports-filters";
import { ChartCard } from "./chart-card";
import { defaultReportFilters, reportFiltersToQuery } from "./report-query";
import type { AdminReportPayload, ReportFiltersState } from "./types";

export function AdminReportsView() {
  const [filters, setFilters] = useState<ReportFiltersState>(defaultReportFilters);
  const [data, setData] = useState<AdminReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    createApiClient(getApiClientOptions())
      .get<AdminReportPayload>(`/admin/reports?${reportFiltersToQuery(filters)}`)
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err instanceof ApiError ? err.message : "Could not load reports");
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only; Apply triggers refresh
  }, []);

  if (loading && !data && !error) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={load} className="mx-auto max-w-lg" />;
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <ReportsFilters
        value={filters}
        onChange={setFilters}
        onApply={load}
        loading={loading}
        showBranchStaffService={false}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total tenants" value={String(summary?.tenants ?? 0)} icon={Building2} />
        <MetricCard title="New tenants" value={String(summary?.new_tenants ?? 0)} icon={Users} />
        <MetricCard
          title="MRR"
          value={formatMoney(summary?.mrr_cents ?? 0)}
          hint="Active paid subscriptions"
          icon={TrendingUp}
        />
        <MetricCard
          title="Subscription revenue"
          value={formatMoney(summary?.subscription_revenue_cents ?? 0)}
          icon={CreditCard}
        />
        <MetricCard title="Platform bookings" value={String(summary?.platform_bookings ?? 0)} icon={Users} />
        <MetricCard
          title="SMS"
          value={String(summary?.sms_sent ?? 0)}
          hint={`${summary?.sms_failed ?? 0} failed`}
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tenant growth">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.tenant_growth ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription MRR">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.subscription_mrr ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMoney(Number(v))} width={72} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatMoney(Number(v ?? 0)), "MRR"]} />
              <Line type="monotone" dataKey="mrr_cents" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription revenue (daily)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.subscription_revenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMoney(Number(v))} width={72} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatMoney(Number(v ?? 0)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue_cents" stroke="hsl(var(--accent))" fill="hsl(var(--primary) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform SMS usage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.sms_usage ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#8a7a7f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Top salons by bookings" heightClass="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.bookings_by_tenant ?? []} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="bookings" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
