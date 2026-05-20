"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentCard } from "@/features/appointments/appointment-card";
import { AppointmentReschedulePanel } from "@/features/appointments/appointment-reschedule-panel";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentsListMeta,
} from "@/lib/api/types";
import { APPOINTMENT_STATUSES, STATUS_LABELS } from "@/lib/appointments/status";
import { cn } from "@/lib/utils";

type TimeFilter = "today" | "upcoming" | "past" | "all";

type AppointmentsResponse = {
  data: Appointment[];
  meta: AppointmentsListMeta;
};

function normalizeAppointments(res: AppointmentsResponse): Appointment[] {
  return Array.isArray(res.data) ? res.data : [];
}

function groupLabel(dateKey: string): string {
  const date = parseISO(dateKey);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

type AppointmentsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function AppointmentsView({ tenantSlug, currency = "USD" }: AppointmentsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canUpdate = can(Permissions.bookings.update);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<AppointmentsListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const params = new URLSearchParams({
          filter: timeFilter,
          per_page: "50",
        });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchDebounced) params.set("q", searchDebounced);

        const res = await createApiClient(getApiClientOptions()).get<AppointmentsResponse>(
          `/${tenantSlug}/appointments?${params}`
        );
        setAppointments(normalizeAppointments(res));
        setMeta(res.meta ?? null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load appointments");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantSlug, timeFilter, statusFilter, searchDebounced]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(uuid: string, status: AppointmentStatus) {
    try {
      const res = await createApiClient(getApiClientOptions()).patch<{
        data: Appointment;
      }>(`/${tenantSlug}/appointments/${uuid}`, { status });
      setAppointments((prev) => prev.map((a) => (a.uuid === uuid ? { ...a, ...res.data } : a)));
      toast.success(`Marked as ${STATUS_LABELS[status]}`);
      load(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update appointment");
    }
  }

  const rescheduleTarget = useMemo(
    () => appointments.find((a) => a.uuid === rescheduleId) ?? null,
    [appointments, rescheduleId]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      if (!apt.starts_at) continue;
      const key = format(parseISO(apt.starts_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(apt);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments]);

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-muted-foreground">
            Manage bookings, confirm clients, and track your schedule
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href={`/${tenantSlug}/book`}>
              <Plus className="h-4 w-4" />
              New booking
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Today"
          value={String(meta?.summary?.today ?? 0)}
          icon={CalendarDays}
          hint="On the calendar today"
        />
        <StatCard
          title="Pending"
          value={String(meta?.summary?.pending ?? 0)}
          icon={Clock}
          hint="Awaiting confirmation"
        />
        <StatCard
          title="Upcoming"
          value={String(meta?.summary?.upcoming ?? 0)}
          icon={CalendarClock}
          hint="Active future bookings"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {timeFilters.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={timeFilter === key ? "default" : "outline"}
              onClick={() => setTimeFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search client, service, staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments found"
          description={
            timeFilter === "today"
              ? "Nothing scheduled for today. Check upcoming or create a new booking."
              : "Try another filter or add a booking from the client page."
          }
        />
      ) : (
        <div className="space-y-8">
          {rescheduleTarget && canUpdate ? (
            <AppointmentReschedulePanel
              tenantSlug={tenantSlug}
              appointment={rescheduleTarget}
              onClose={() => setRescheduleId(null)}
              onRescheduled={(updated) => {
                setAppointments((prev) => prev.map((a) => (a.uuid === updated.uuid ? updated : a)));
                setRescheduleId(null);
                load(true);
              }}
            />
          ) : null}
          {grouped.map(([dateKey, items]) => (
            <section key={dateKey}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-accent" />
                {groupLabel(dateKey)}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium normal-case">
                  {items.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {items.map((apt) => (
                  <li key={apt.uuid}>
                    <AppointmentCard
                      appointment={apt}
                      currency={currency}
                      canUpdate={canUpdate}
                      onStatusChange={handleStatusChange}
                      onReschedule={
                        canUpdate && !["completed", "cancelled", "no_show"].includes(apt.status)
                          ? () => {
                              setRescheduleId(apt.uuid);
                              setSelectedId(apt.uuid);
                            }
                          : undefined
                      }
                      selected={selectedId === apt.uuid}
                      onSelect={() => setSelectedId(apt.uuid === selectedId ? null : apt.uuid)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {meta && meta.total > appointments.length ? (
            <p className="text-center text-xs text-muted-foreground">
              Showing {appointments.length} of {meta.total} appointments
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
