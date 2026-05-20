"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Calendar, DollarSign, MessageSquare, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError, createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import { ReportsFilters } from "./reports-filters";
import { ChartCard } from "./chart-card";
import { defaultReportFilters, reportFiltersToQuery } from "./report-query";
import type { ReportFiltersState, TenantReportPayload } from "./types";

const PAYMENT_COLORS = ["#E879A6", "#F8BBD0", "#C4A4AC", "#8a7a7f", "#3D2B30"];

type TenantReportsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function TenantReportsView({ tenantSlug, currency = "GHS" }: TenantReportsViewProps) {
  const [filters, setFilters] = useState<ReportFiltersState>(defaultReportFilters);
  const [data, setData] = useState<TenantReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    createApiClient(getApiClientOptions())
      .get<TenantReportPayload>(`/${tenantSlug}/reports?${reportFiltersToQuery(filters)}`)
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err instanceof ApiError ? err.message : "Could not load reports");
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, filters]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when workspace changes only
  }, [tenantSlug]);

  if (loading && !data && !error) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={load} className="mx-auto max-w-lg" />;
  }

  const summary = data?.summary;
  const paymentData =
    data?.payment_status.map((row) => ({
      name: row.status.replace(/_/g, " "),
      value: row.count,
    })) ?? [];

  return (
    <div className="space-y-6">
      <ReportsFilters
        value={filters}
        options={data?.filter_options}
        onChange={setFilters}
        onApply={load}
        loading={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Revenue"
          value={formatMoney(summary?.revenue_cents ?? 0, currency)}
          icon={DollarSign}
        />
        <MetricCard title="Bookings" value={String(summary?.bookings ?? 0)} icon={Calendar} />
        <MetricCard
          title="Customers"
          value={String(summary?.customers ?? 0)}
          hint={`${summary?.new_customers ?? 0} new`}
          icon={Users}
        />
        <MetricCard title="SMS sent" value={String(summary?.sms_sent ?? 0)} icon={MessageSquare} />
        <MetricCard
          title="SMS failed"
          value={String(summary?.sms_failed ?? 0)}
          icon={MessageSquare}
        />
        <MetricCard title="Period" value={filters.from} hint={`to ${filters.to}`} icon={BarChart3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMoney(Number(v), currency)} width={64} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatMoney(Number(v ?? 0), currency), "Revenue"]} />
              <Area type="monotone" dataKey="revenue_cents" stroke="hsl(var(--accent))" fill="hsl(var(--primary) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bookings">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.bookings ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New customers">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.customers ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SMS usage">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Staff performance" heightClass="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.staff_performance ?? []} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Popular services" heightClass="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.popular_services ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment status">
          {paymentData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No payment data</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}