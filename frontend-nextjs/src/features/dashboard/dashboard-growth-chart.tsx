"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthChartPoint } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";

type DashboardGrowthChartProps = {
  title: string;
  data: GrowthChartPoint[];
  mode: "revenue" | "bookings";
  currency?: string;
  className?: string;
};

function formatChartMoney(cents: number, currency: string) {
  const value = cents / 100;
  if (value >= 1_000_000) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatMoney(cents, currency);
}

function ChartTooltip({
  active,
  payload,
  label,
  mode,
  currency,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
  mode: "revenue" | "bookings";
  currency: string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {mode === "revenue" ? formatMoney(value, currency) : `${value} bookings`}
      </p>
    </div>
  );
}

export function DashboardGrowthChart({
  title,
  data,
  mode,
  currency = "USD",
  className,
}: DashboardGrowthChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const chartData = data.map((point) => ({
    label: point.label,
    value: mode === "revenue" ? point.revenue_cents : point.bookings,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 text-center sm:min-h-[280px]",
          className
        )}
      >
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">No data for this period yet.</p>
      </div>
    );
  }

  const stroke = mode === "revenue" ? "hsl(var(--primary))" : "hsl(var(--accent))";
  const fillStart = mode === "revenue" ? "hsl(var(--primary) / 0.35)" : "hsl(var(--accent) / 0.3)";
  const fillEnd = mode === "revenue" ? "hsl(var(--primary) / 0.02)" : "hsl(var(--accent) / 0.02)";

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:p-5",
        className
      )}
    >
      <p className="mb-3 text-sm font-semibold text-foreground sm:mb-4">{title}</p>
      <div className="h-[220px] w-full min-w-0 sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillStart} />
                <stop offset="100%" stopColor={fillEnd} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border) / 0.6)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) =>
                mode === "revenue"
                  ? formatChartMoney(Number(v), currency)
                  : String(v)
              }
            />
            <Tooltip
              content={<ChartTooltip mode={mode} currency={currency} />}
              cursor={{ stroke: "hsl(var(--primary) / 0.25)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: stroke, stroke: "hsl(var(--card))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
