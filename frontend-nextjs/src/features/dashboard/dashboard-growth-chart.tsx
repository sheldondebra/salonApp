"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney } from "@/lib/format/money";
import type { GrowthChartPoint } from "@/lib/api/types";
import { Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartMode = "revenue" | "business";

type DashboardGrowthChartProps = {
  title: string;
  subtitle: string;
  data: GrowthChartPoint[];
  currency: string;
  mode: ChartMode;
  className?: string;
};

const CHART_COLORS = {
  revenue: "#f97316",
  bookings: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  self: "#a855f7",
};

function ChartTooltip({
  active,
  payload,
  currency,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload?: GrowthChartPoint }>;
  currency: string;
  mode: ChartMode;
}) {
  if (!active || !payload?.length) return null;

  const date = payload[0]?.payload?.date;

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 font-medium text-zinc-300">
        {date ? format(new Date(date), "MMM d, yyyy") : ""}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-medium text-zinc-100">
              {mode === "revenue" && entry.name === "Revenue"
                ? formatMoney(entry.value, currency)
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardGrowthChart({
  title,
  subtitle,
  data,
  currency,
  mode,
  className,
}: DashboardGrowthChartProps) {
  const hasData = useMemo(
    () =>
      data.some((d) =>
        mode === "revenue"
          ? d.revenue_cents > 0
          : d.bookings > 0 || d.completed > 0 || d.cancelled > 0 || d.self_bookings > 0
      ),
    [data, mode]
  );

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 shadow-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Analytics
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-zinc-100">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <div className="flex-1 px-2 pb-4 pt-2 sm:px-4">
        {!hasData ? (
          <EmptyState
            icon={mode === "revenue" ? TrendingUp : Activity}
            title="No data in range"
            description="Metrics appear as bookings are created and completed."
            className="border-0 bg-transparent text-zinc-400 [&_h3]:text-zinc-300"
          />
        ) : mode === "revenue" ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v) => {
                  const n = Number(v);
                  if (n >= 100000) return `$${(n / 100000).toFixed(0)}k`;
                  if (n >= 10000) return `$${(n / 100).toFixed(0)}`;
                  return formatMoney(n, currency);
                }}
              />
              <Tooltip content={<ChartTooltip currency={currency} mode="revenue" />} />
              <Area
                type="monotone"
                dataKey="revenue_cents"
                name="Revenue"
                stroke={CHART_COLORS.revenue}
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip currency={currency} mode="business" />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span className="text-zinc-400">{value}</span>}
              />
              <Bar
                yAxisId="left"
                dataKey="bookings"
                name="Total"
                fill={CHART_COLORS.bookings}
                fillOpacity={0.35}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke={CHART_COLORS.completed}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cancelled"
                name="Cancelled"
                stroke={CHART_COLORS.cancelled}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="self_bookings"
                name="Self-booked"
                stroke={CHART_COLORS.self}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
