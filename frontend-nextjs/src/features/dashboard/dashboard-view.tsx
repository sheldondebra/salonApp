"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/client";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import { useAbilities } from "@/hooks/use-abilities";
import { useSessionUser } from "@/hooks/use-session-user";
import { Permissions } from "@/lib/auth/permissions";
import type { Appointment, DashboardStats } from "@/lib/api/types";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import {
  DashboardListRow,
  DashboardSection,
  DashboardStatGrid,
  IconStatCard,
} from "./dashboard-ui";

type DashboardViewProps = {
  tenantSlug: string;
  tenantName?: string;
  currency?: string;
};

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
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base = `/${tenantSlug}`;
  const displayName =
    tenantName ??
    tenantSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const client = createApiClient(getApiClientOptions());
    return Promise.all([
      client.get<{ stats: DashboardStats }>(`/${tenantSlug}/dashboard/stats`),
      client.get<{ data: Appointment[] }>(`/${tenantSlug}/dashboard/upcoming`),
    ])
      .then(([statsRes, upcomingRes]) => {
        setStats(statsRes.stats);
        setUpcoming(upcomingRes.data ?? []);
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

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {getGreeting()}, {firstName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stats?.appointments_today ?? 0} appointments today ·{" "}
          {stats?.pending_bookings ?? 0} pending
        </p>
      </header>

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
          label="Revenue this month"
          value={formatMoney(stats?.revenue_month_cents ?? 0, currency)}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
      </DashboardStatGrid>

      <DashboardSection title="Quick actions">
        <DashboardQuickActions tenantSlug={tenantSlug} can={can} />
      </DashboardSection>

      <DashboardSection
        title="Upcoming appointments"
        action={
          can(Permissions.bookings.view) ? (
            <Link
              href={`${base}/appointments`}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              See all
            </Link>
          ) : undefined
        }
      >
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {upcoming.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No upcoming appointments.{" "}
              {can(Permissions.bookings.view) ? (
                <Link href={`${base}/appointments`} className="font-medium text-primary hover:underline">
                  Open calendar
                </Link>
              ) : null}
            </p>
          ) : (
            <ul className="divide-y divide-border/60 px-4">
              {upcoming.slice(0, 6).map((apt) => (
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

      {can(Permissions.analytics.view) ? (
        <Link
          href={`${base}/reports`}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          <span>View reports & analytics</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ) : null}
    </div>
  );
}
