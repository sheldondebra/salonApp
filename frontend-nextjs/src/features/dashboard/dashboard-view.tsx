"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Smartphone,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type {
  Appointment,
  DashboardBookingsBreakdown,
  DashboardStats,
  GrowthChartPoint,
} from "@/lib/api/types";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardModuleNav } from "./dashboard-module-nav";
import { DashboardGrowthChart } from "./dashboard-growth-chart";
import { DashboardBookingsPanels } from "./dashboard-bookings-panels";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  tenantSlug: string;
  currency?: string;
};

type ChartRange = 7 | 30;

function unwrapAppointments(
  payload: Appointment[] | { data?: Appointment[] } | undefined
): Appointment[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

function statusVariant(status: string): "default" | "secondary" | "success" | "warning" | "outline" {
  if (status === "completed" || status === "confirmed") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled" || status === "no_show") return "outline";
  return "secondary";
}

export function DashboardView({ tenantSlug, currency = "USD" }: DashboardViewProps) {
  const { can } = useAbilities(tenantSlug);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<GrowthChartPoint[]>([]);
  const [breakdown, setBreakdown] = useState<DashboardBookingsBreakdown | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const client = createApiClient(getApiClientOptions());
    return Promise.all([
      client.get<{ stats: DashboardStats }>(`/${tenantSlug}/dashboard/stats`),
      client.get<{ data: GrowthChartPoint[] }>(
        `/${tenantSlug}/dashboard/growth-chart?days=${chartRange}`
      ),
      client.get<DashboardBookingsBreakdown>(`/${tenantSlug}/dashboard/bookings-breakdown`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/upcoming`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/recent`),
    ])
      .then(([statsRes, chartRes, breakdownRes, upcomingRes, recentRes]) => {
        setStats(statsRes.stats);
        setChart(chartRes.data ?? []);
        setBreakdown({
          cancelled: unwrapAppointments(breakdownRes.cancelled),
          completed: unwrapAppointments(breakdownRes.completed),
          self_bookings: unwrapAppointments(breakdownRes.self_bookings),
        });
        setUpcoming(upcomingRes.data ?? []);
        setRecent(recentRes.data ?? []);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load dashboard");
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, chartRange]);

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
    <div className="w-full max-w-none space-y-8">
      <section className="relative w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 px-6 py-8 shadow-soft sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Salon overview</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatMoney(stats?.revenue_month_cents ?? 0, currency)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Revenue this month</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([7, 30] as ChartRange[]).map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant={chartRange === days ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setChartRange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Quick actions</h3>
        <DashboardQuickActions tenantSlug={tenantSlug} can={can} />
      </section>

      <section className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6 items-stretch">
        <MetricCard
          title="Today's bookings"
          value={String(stats?.appointments_today ?? 0)}
          icon={Calendar}
        />
        <MetricCard
          title="Revenue"
          value={formatMoney(stats?.revenue_month_cents ?? 0, currency)}
          icon={DollarSign}
          hint="This month"
        />
        <MetricCard
          title="Completed"
          value={String(stats?.completed_month ?? 0)}
          icon={CheckCircle2}
          hint="This month"
          className="border-emerald-500/20"
        />
        <MetricCard
          title="Cancelled"
          value={String(stats?.cancelled_month ?? 0)}
          icon={Ban}
          hint="This month"
          className="border-red-500/20"
        />
        <MetricCard
          title="Self bookings"
          value={String(stats?.self_bookings_month ?? 0)}
          icon={Smartphone}
          hint="Online this month"
          className="border-violet-500/20"
        />
        <MetricCard
          title="Pending"
          value={String(stats?.pending_bookings ?? 0)}
          icon={Clock}
        />
      </section>

      <section className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2 items-stretch">
        <div className="min-w-0">
          <DashboardGrowthChart
            title="Revenue growth"
            subtitle={`Daily revenue · last ${chartRange} days`}
            data={chart}
            currency={currency}
            mode="revenue"
            className="min-h-[360px] w-full"
          />
        </div>
        <div className="min-w-0">
          <DashboardGrowthChart
            title="Business growth"
            subtitle={`Bookings volume & outcomes · last ${chartRange} days`}
            data={chart}
            currency={currency}
            mode="business"
            className="min-h-[360px] w-full"
          />
        </div>
      </section>

      <section className="w-full">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Booking breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Cancelled, completed, and client self-service bookings
            </p>
          </div>
        </div>
        <DashboardBookingsPanels
          cancelled={breakdown?.cancelled ?? []}
          completed={breakdown?.completed ?? []}
          self_bookings={breakdown?.self_bookings ?? []}
        />
      </section>

      <Card className="w-full rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">Jump to</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardModuleNav tenantSlug={tenantSlug} can={can} />
        </CardContent>
      </Card>

      <section className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2 items-stretch">
        <Card className="flex h-full min-w-0 flex-col rounded-2xl border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent bookings</CardTitle>
            {can(Permissions.bookings.view) ? (
              <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                <Link href={`${base}/appointments`}>View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="min-w-0 flex-1 overflow-x-auto">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No past bookings yet.</p>
            ) : (
              <Table className="w-full min-w-[32rem]">
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

        <Card className="flex h-full min-w-0 flex-col rounded-2xl border-border/60 shadow-soft">
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
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                  )}
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
      </section>
    </div>
  );
}
