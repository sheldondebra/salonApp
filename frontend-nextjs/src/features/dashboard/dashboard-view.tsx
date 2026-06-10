"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Smartphone,
  UserCircle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/client";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { getStaffStats } from "@/lib/api/staff-meta-cache";
import { formatMoney } from "@/lib/format/money";
import { useAbilities } from "@/hooks/use-abilities";
import { useSessionUser } from "@/hooks/use-session-user";
import { Permissions } from "@/lib/auth/permissions";
import type {
  Appointment,
  DashboardBookingsBreakdown,
  DashboardStats,
  GrowthChartPoint,
  StaffStats,
} from "@/lib/api/types";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardModuleNav } from "./dashboard-module-nav";
import { DashboardGrowthChart } from "./dashboard-growth-chart";
import { DashboardBookingsPanels } from "./dashboard-bookings-panels";
import {
  ChartRangeToggle,
  DashboardHeroHeader,
  DashboardListRow,
  DashboardPanelCard,
  DashboardSection,
  DashboardStatGrid,
  IconStatCard,
} from "./dashboard-ui";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  tenantSlug: string;
  tenantName?: string;
  currency?: string;
};

type ChartRangeKey = "week" | "month" | "year";

const RANGE_DAYS: Record<ChartRangeKey, number> = {
  week: 7,
  month: 30,
  year: 90,
};

function unwrapAppointments(
  payload: Appointment[] | { data?: Appointment[] } | undefined
): Appointment[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

function formatAppointmentSubtitle(apt: Appointment): string {
  return [
    apt.starts_at ? format(new Date(apt.starts_at), "EEE, MMM d · h:mm a") : null,
    apt.client?.name,
    apt.staff_member?.display_name ? `With ${apt.staff_member.display_name}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusBadge(status: string) {
  return (
    <Badge variant="outline" className="capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function DashboardView({
  tenantSlug,
  tenantName,
  currency = "USD",
}: DashboardViewProps) {
  const { can } = useAbilities(tenantSlug);
  const { user } = useSessionUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<GrowthChartPoint[]>([]);
  const [breakdown, setBreakdown] = useState<DashboardBookingsBreakdown | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [chartRange, setChartRange] = useState<ChartRangeKey>("week");
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showStaff = can(Permissions.staff.view);
  const showPos = can(Permissions.pos.view);
  const base = `/${tenantSlug}`;
  const displayName =
    tenantName ??
    tenantSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const chartDays = RANGE_DAYS[chartRange];

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const client = createApiClient(getApiClientOptions());
    return Promise.all([
      client.get<{ stats: DashboardStats }>(`/${tenantSlug}/dashboard/stats`),
      client.get<{ data: GrowthChartPoint[] }>(
        `/${tenantSlug}/dashboard/growth-chart?days=${chartDays}`
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
  }, [tenantSlug, chartDays]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showStaff) {
      setStaffStats(null);
      return;
    }
    let cancelled = false;
    void getStaffStats(tenantSlug)
      .then((data) => {
        if (!cancelled) setStaffStats(data);
      })
      .catch(() => {
        if (!cancelled) setStaffStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, showStaff]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={load} className="mx-auto max-w-lg" />;
  }

  return (
    <div className="w-full min-w-0 space-y-5 pb-6 sm:space-y-6 sm:pb-8">
      <DashboardHeroHeader
        greeting={`${getGreeting()}, ${firstName}`}
        displayName={displayName}
        revenueLabel="Revenue this month"
        revenueValue={formatMoney(stats?.revenue_month_cents ?? 0, currency)}
      />

      <DashboardStatGrid>
        <IconStatCard
          icon={Calendar}
          label="Today"
          value={String(stats?.appointments_today ?? 0)}
          iconClassName="bg-primary/15 text-primary"
        />
        <IconStatCard
          icon={Clock}
          label="Pending"
          value={String(stats?.pending_bookings ?? 0)}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <IconStatCard
          icon={DollarSign}
          label="Revenue"
          value={formatMoney(stats?.revenue_month_cents ?? 0, currency)}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        {showPos ? (
          <IconStatCard
            icon={ShoppingCart}
            label="POS today"
            value={formatMoney(stats?.pos_sales_today_cents ?? 0, currency)}
            iconClassName="bg-violet-500/10 text-violet-600"
          />
        ) : (
          <IconStatCard
            icon={CheckCircle2}
            label="Completed"
            value={String(stats?.completed_month ?? 0)}
            iconClassName="bg-emerald-500/10 text-emerald-600"
          />
        )}
      </DashboardStatGrid>

      <DashboardSection
        title="Revenue trend"
        description={`Daily revenue · last ${chartDays} days`}
        action={<ChartRangeToggle value={chartRange} onChange={setChartRange} />}
      >
        <DashboardGrowthChart
          title={`Last ${chartDays} days`}
          data={chart}
          currency={currency}
          mode="revenue"
        />
      </DashboardSection>

      <DashboardSection title="Quick actions" description="Jump to your daily tools">
        <DashboardQuickActions tenantSlug={tenantSlug} can={can} />
      </DashboardSection>

      <div className="grid w-full min-w-0 gap-5 lg:grid-cols-2 lg:gap-6">
        <DashboardSection
          title="Upcoming appointments"
          action={
            can(Permissions.bookings.view) ? (
              <Link
                href={`${base}/appointments`}
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
              >
                See all
              </Link>
            ) : undefined
          }
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            {upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
                No upcoming appointments.
              </p>
            ) : (
              <ul className="px-4 sm:px-5">
                {upcoming.slice(0, 8).map((apt) => (
                  <DashboardListRow
                    key={apt.uuid}
                    title={apt.service?.name ?? "Service"}
                    subtitle={formatAppointmentSubtitle(apt)}
                    trailing={statusBadge(apt.status)}
                    href={`${base}/appointments?highlight=${apt.uuid}`}
                  />
                ))}
              </ul>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Bookings volume"
          description={`Appointments per day · last ${chartDays} days`}
        >
          <DashboardGrowthChart
            title="Daily bookings"
            data={chart}
            currency={currency}
            mode="bookings"
          />
        </DashboardSection>
      </div>

      {showStaff && staffStats ? (
        <DashboardSection
          title="Team snapshot"
          action={
            <Link
              href={`${base}/staff`}
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Open team
            </Link>
          }
        >
          <DashboardStatGrid>
            <IconStatCard
              icon={Users}
              label="Team members"
              value={String(staffStats.total)}
              iconClassName="bg-primary/15 text-primary"
            />
            <IconStatCard
              icon={UserCircle}
              label="Available now"
              value={String(staffStats.available_now)}
              iconClassName="bg-emerald-500/10 text-emerald-600"
            />
          </DashboardStatGrid>
        </DashboardSection>
      ) : null}

      <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
        {stats?.completed_month ?? 0} completed · {stats?.self_bookings_month ?? 0} online ·{" "}
        {stats?.new_customers_month ?? 0} new clients this month
      </div>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-colors active:bg-muted/40"
        >
          More insights
          <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
        </button>

        {moreOpen ? (
          <div className="space-y-5 sm:space-y-6">
            <DashboardStatGrid>
              <IconStatCard
                icon={CheckCircle2}
                label="Completed"
                value={String(stats?.completed_month ?? 0)}
                iconClassName="bg-emerald-500/10 text-emerald-600"
              />
              <IconStatCard
                icon={Ban}
                label="Cancelled"
                value={String(stats?.cancelled_month ?? 0)}
                iconClassName="bg-red-500/10 text-red-600"
              />
              <IconStatCard
                icon={Smartphone}
                label="Online bookings"
                value={String(stats?.self_bookings_month ?? 0)}
                iconClassName="bg-violet-500/10 text-violet-600"
              />
              {showPos ? (
                <IconStatCard
                  icon={ShoppingCart}
                  label="POS this month"
                  value={formatMoney(stats?.pos_sales_month_cents ?? 0, currency)}
                  iconClassName="bg-violet-500/10 text-violet-600"
                />
              ) : null}
              {can(Permissions.inventory.view) ? (
                <IconStatCard
                  icon={Package}
                  label="Active products"
                  value={String(stats?.active_products ?? 0)}
                  iconClassName="bg-amber-500/10 text-amber-600"
                />
              ) : null}
            </DashboardStatGrid>

            <DashboardSection title="Booking breakdown">
              <DashboardBookingsPanels
                cancelled={breakdown?.cancelled ?? []}
                completed={breakdown?.completed ?? []}
                self_bookings={breakdown?.self_bookings ?? []}
              />
            </DashboardSection>

            {recent.length > 0 ? (
              <DashboardSection
                title="Recent bookings"
                action={
                  can(Permissions.bookings.view) ? (
                    <Link
                      href={`${base}/appointments`}
                      className="shrink-0 text-sm font-semibold text-primary hover:underline"
                    >
                      See all
                    </Link>
                  ) : undefined
                }
              >
                <DashboardPanelCard title="Latest activity">
                  <ul>
                    {recent.slice(0, 6).map((apt) => (
                      <DashboardListRow
                        key={apt.uuid}
                        title={apt.service?.name ?? "Service"}
                        subtitle={formatAppointmentSubtitle(apt)}
                        trailing={statusBadge(apt.status)}
                        href={`${base}/appointments?highlight=${apt.uuid}`}
                      />
                    ))}
                  </ul>
                </DashboardPanelCard>
              </DashboardSection>
            ) : null}

            <DashboardPanelCard title="Jump to" description="Open any module">
              <div className="py-3">
                <DashboardModuleNav tenantSlug={tenantSlug} can={can} />
              </div>
            </DashboardPanelCard>
          </div>
        ) : null}
      </section>
    </div>
  );
}
