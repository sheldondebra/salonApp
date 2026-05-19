"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, Clock, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Appointment, DashboardStats, RevenueChartPoint } from "@/lib/api/types";

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

type DashboardViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function DashboardView({ tenantSlug, currency = "USD" }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<RevenueChartPoint[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createApiClient(getApiClientOptions());
    Promise.all([
      client.get<{ stats: DashboardStats }>(`/${tenantSlug}/dashboard/stats`),
      client.get<{ data: RevenueChartPoint[] }>(`/${tenantSlug}/dashboard/revenue-chart`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/upcoming`),
    ])
      .then(([statsRes, chartRes, upcomingRes]) => {
        setStats(statsRes.stats);
        setChart(chartRes.data);
        setUpcoming(upcomingRes.data);
      })
      .catch(() => {
        /* demo may run without API — show empty */
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of bookings and revenue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's appointments"
          value={String(stats?.appointments_today ?? 0)}
          icon={Calendar}
        />
        <StatCard
          title="Revenue this month"
          value={formatCurrency(stats?.revenue_month_cents ?? 0, currency)}
          icon={DollarSign}
          trend="+12% vs last month"
        />
        <StatCard
          title="Pending bookings"
          value={String(stats?.pending_bookings ?? 0)}
          icon={Clock}
        />
        <StatCard
          title="Completed this month"
          value={String(stats?.completed_month ?? 0)}
          icon={TrendingUp}
        />
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Revenue (7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {chart.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No revenue data yet"
              description="Bookings will appear here once your API is connected and seeded."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E879A6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E879A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v / 100}`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value ?? 0), currency),
                    "Revenue",
                  ]}
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as string | undefined;
                    return date ? format(new Date(date), "MMM d, yyyy") : "";
                  }}
                />
                <Area type="monotone" dataKey="revenue_cents" stroke="#E879A6" fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Upcoming appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming appointments</p>
          ) : (
            upcoming.map((apt) => (
              <div
                key={apt.uuid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{apt.service?.name ?? "Service"}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.starts_at ? format(new Date(apt.starts_at), "EEE, MMM d · h:mm a") : "—"}
                    {apt.staff_member ? ` · ${apt.staff_member.display_name}` : ""}
                  </p>
                </div>
                <Badge variant={apt.status === "pending" ? "warning" : "success"}>{apt.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
