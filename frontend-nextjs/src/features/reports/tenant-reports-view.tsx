"use client";

import { useCallback, useEffect, useId, useState } from "react";
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
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError, createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import { ReportsFilters } from "./reports-filters";
import { ChartCard } from "./chart-card";
import { hasNumericActivity, hasRows } from "./chart-utils";
import { defaultReportFilters, reportFiltersToQuery } from "./report-query";
import { CHART_AXIS, CHART_GRID, ChartTooltipBox, formatChartMoney } from "./chart-theme";
import { ReportsHero, ReportsSection, ReportsStatCard, ReportsStatGrid } from "./reports-ui";
import { cn } from "@/lib/utils";
import type { ReportFiltersState, TenantReportPayload } from "./types";

const PAYMENT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#E879A6",
  "#C4A4AC",
  "#8a7a7f",
];

type TenantReportsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function TenantReportsView({ tenantSlug, currency = "GHS" }: TenantReportsViewProps) {
  const revenueGradientId = useId().replace(/:/g, "");
  const [filters, setFilters] = useState<ReportFiltersState>(defaultReportFilters);
  const [data, setData] = useState<TenantReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (override?: ReportFiltersState) => {
      const active = override ?? filters;
      setLoading(true);
      setError(null);
      createApiClient(getApiClientOptions())
        .get<TenantReportPayload>(`/${tenantSlug}/reports?${reportFiltersToQuery(active)}`)
        .then((payload) => {
          setData(payload);
          if (override) setFilters(override);
        })
        .catch((err) => {
          setData(null);
          setError(err instanceof ApiError ? err.message : "Could not load reports");
        })
        .finally(() => setLoading(false));
    },
    [tenantSlug, filters]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when workspace changes only
  }, [tenantSlug]);

  if (loading && !data && !error) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={() => load()} className="mx-auto max-w-lg" />;
  }

  const summary = data?.summary;
  const paymentData =
    data?.payment_status.map((row) => ({
      name: row.status.replace(/_/g, " "),
      value: row.count,
    })) ?? [];

  const chartFade = loading && data ? "pointer-events-none opacity-60 transition-opacity" : "";

  return (
    <div className="w-full min-w-0 space-y-5 pb-6 sm:space-y-6 sm:pb-8">
      <ReportsFilters
        value={filters}
        options={data?.filter_options}
        onChange={setFilters}
        onApply={load}
        loading={loading}
      />

      <ReportsHero
        periodFrom={filters.from}
        periodTo={filters.to}
        revenueLabel="Total revenue"
        revenueValue={formatMoney(summary?.revenue_cents ?? 0, currency)}
        bookings={summary?.bookings ?? 0}
      />

      <ReportsStatGrid>
        <ReportsStatCard
          label="Revenue"
          value={formatMoney(summary?.revenue_cents ?? 0, currency)}
          icon={DollarSign}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <ReportsStatCard
          label="Bookings"
          value={String(summary?.bookings ?? 0)}
          icon={Calendar}
          iconClassName="bg-primary/15 text-primary"
        />
        <ReportsStatCard
          label="Customers"
          value={String(summary?.customers ?? 0)}
          hint={`${summary?.new_customers ?? 0} new`}
          icon={Users}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <ReportsStatCard
          label="SMS sent"
          value={String(summary?.sms_sent ?? 0)}
          icon={MessageSquare}
          iconClassName="bg-sky-500/10 text-sky-600"
        />
        <ReportsStatCard
          label="SMS failed"
          value={String(summary?.sms_failed ?? 0)}
          icon={MessageSquare}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <ReportsStatCard
          label="New customers"
          value={String(summary?.new_customers ?? 0)}
          icon={BarChart3}
          iconClassName="bg-primary/15 text-primary"
        />
      </ReportsStatGrid>

      <ReportsSection title="Revenue & bookings" description="Daily trends for the selected period">
        <div className={cn("grid w-full min-w-0 gap-4 lg:grid-cols-2 lg:gap-5", chartFade)}>
          <ChartCard
            title="Revenue"
            description="Daily revenue"
            isEmpty={!hasNumericActivity(data?.revenue, ["revenue_cents"])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenue ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id={revenueGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.35)" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" tick={CHART_AXIS.tick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis
                  tick={CHART_AXIS.tick}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => formatChartMoney(Number(v), currency)}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(label ?? "")}
                        value={formatMoney(Number(payload[0]?.value ?? 0), currency)}
                      />
                    ) : null
                  }
                  cursor={{ stroke: "hsl(var(--primary) / 0.25)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue_cents"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill={`url(#${revenueGradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Bookings"
            description="Appointments per day"
            isEmpty={!hasNumericActivity(data?.bookings, ["count"])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.bookings ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" tick={CHART_AXIS.tick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(label ?? "")}
                        value={`${payload[0]?.value ?? 0} bookings`}
                      />
                    ) : null
                  }
                  cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ReportsSection>

      <ReportsSection title="Customers & messaging" description="Growth and SMS delivery">
        <div className={cn("grid w-full min-w-0 gap-4 lg:grid-cols-2 lg:gap-5", chartFade)}>
          <ChartCard
            title="New customers"
            description="Daily sign-ups"
            isEmpty={!hasNumericActivity(data?.customers, ["count"])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.customers ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" tick={CHART_AXIS.tick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(label ?? "")}
                        value={`${payload[0]?.value ?? 0} customers`}
                      />
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--accent))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="SMS usage"
            description="Sent vs failed"
            isEmpty={!hasNumericActivity(data?.sms_usage, ["sent", "failed"])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sms_usage ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" tick={CHART_AXIS.tick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="failed" name="Failed" fill="#8a7a7f" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ReportsSection>

      <ReportsSection title="Team & services" description="Performance breakdown">
        <div className={cn("grid w-full min-w-0 gap-4 lg:grid-cols-2 lg:gap-5", chartFade)}>
          <ChartCard
            title="Staff performance"
            description="Bookings by team member"
            heightClass="h-[260px] sm:h-[320px]"
            isEmpty={!hasRows(data?.staff_performance)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.staff_performance ?? []}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid {...CHART_GRID} horizontal={false} vertical />
                <XAxis type="number" tick={CHART_AXIS.tick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={CHART_AXIS.tick}
                  axisLine={false}
                  tickLine={false}
                  width={88}
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(payload[0]?.payload?.name ?? "")}
                        value={`${payload[0]?.value ?? 0} bookings`}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="bookings" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Popular services"
            description="Most booked services"
            heightClass="h-[260px] sm:h-[320px]"
            isEmpty={!hasRows(data?.popular_services)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.popular_services ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 48 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis
                  dataKey="name"
                  tick={CHART_AXIS.tick}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={56}
                />
                <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(payload[0]?.payload?.name ?? "")}
                        value={`${payload[0]?.value ?? 0} bookings`}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Payment status"
            description="Booking payment mix"
            isEmpty={paymentData.length === 0}
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                  label={({ name, percent }) => {
                    const pct = percent ?? 0;
                    return pct > 0.05 ? `${name} ${(pct * 100).toFixed(0)}%` : "";
                  }}
                >
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        label={String(payload[0]?.name ?? "")}
                        value={`${payload[0]?.value ?? 0} bookings`}
                      />
                    ) : null
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ReportsSection>
    </div>
  );
}
