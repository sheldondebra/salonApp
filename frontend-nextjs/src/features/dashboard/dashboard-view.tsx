"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/client";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import type { Appointment, DashboardStats, RevenueChartPoint } from "@/lib/api/types";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardModuleNav } from "./dashboard-module-nav";

type DashboardViewProps = {
  tenantSlug: string;
  currency?: string;
};

function statusVariant(status: string): "default" | "secondary" | "success" | "warning" | "outline" {
  if (status === "completed" || status === "confirmed") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled" || status === "no_show") return "outline";
  return "secondary";
}

export function DashboardView({ tenantSlug, currency = "USD" }: DashboardViewProps) {
  const { can } = useAbilities(tenantSlug);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<RevenueChartPoint[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const client = createApiClient(getApiClientOptions());
    return Promise.all([
      client.get<{ stats: DashboardStats }>(`/${tenantSlug}/dashboard/stats`),
      client.get<{ data: RevenueChartPoint[] }>(`/${tenantSlug}/dashboard/revenue-chart`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/upcoming`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/recent`),
    ])
      .then(([statsRes, chartRes, upcomingRes, recentRes]) => {
        setStats(statsRes.stats);
        setChart(chartRes.data ?? []);
        setUpcoming(upcomingRes.data ?? []);
        setRecent(recentRes.data ?? []);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load dashboard");
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={load} className="mx-auto max-w-lg" />;
  }

  const base = `/${tenantSlug}`;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Quick actions</p>
        <DashboardQuickActions tenantSlug={tenantSlug} can={can} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's bookings"
          value={String(stats?.appointments_today ?? 0)}
          icon={Calendar}
        />
        <MetricCard
          title="Revenue this month"
          value={formatMoney(stats?.revenue_month_cents ?? 0, currency)}
          icon={DollarSign}
        />
        <MetricCard
          title="New customers"
          value={String(stats?.new_customers_month ?? 0)}
          icon={UserPlus}
          hint="Joined this month"
        />
        <MetricCard
          title="Pending appointments"
          value={String(stats?.pending_bookings ?? 0)}
          icon={Clock}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">Jump to</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardModuleNav tenantSlug={tenantSlug} can={can} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Revenue (7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {chart.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No revenue data yet"
              description="Completed and confirmed bookings will appear here."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="tenantRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => formatMoney(Number(v), currency)}
                  tick={{ fontSize: 12 }}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => [formatMoney(Number(value ?? 0), currency), "Revenue"]}
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as string | undefined;
                    return date ? format(new Date(date), "MMM d, yyyy") : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue_cents"
                  stroke="hsl(var(--accent))"
                  fill="url(#tenantRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent bookings</CardTitle>
            {can(Permissions.bookings.view) ? (
              <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                <Link href={`${base}/appointments`}>View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No past bookings yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((apt) => (
                    <TableRow key={apt.uuid}>
                      <TableCell className="font-medium">{apt.service?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {apt.client?.name ?? "Walk-in"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {apt.starts_at
                          ? format(new Date(apt.starts_at), "MMM d · h:mm a")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(apt.status)} className="capitalize">
                          {apt.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming appointments</CardTitle>
            {can(Permissions.bookings.view) ? (
              <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                <Link href={`${base}/appointments`}>View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming appointments.
              </p>
            ) : (
              upcoming.map((apt) => (
                <div
                  key={apt.uuid}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{apt.service?.name ?? "Service"}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.starts_at
                        ? format(new Date(apt.starts_at), "EEE, MMM d · h:mm a")
                        : "—"}
                      {apt.staff_member ? ` · ${apt.staff_member.display_name}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusVariant(apt.status)} className="capitalize">
                    {apt.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
