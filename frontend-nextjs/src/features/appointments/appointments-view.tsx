"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  LayoutGrid,
  LayoutList,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentCard } from "@/features/appointments/appointment-card";
import { AppointmentReschedulePanel } from "@/features/appointments/appointment-reschedule-panel";
import { StaffBookingPanel } from "@/features/appointments/staff-booking-panel";
import { ScheduleCalendarPanel } from "@/features/schedule/schedule-calendar-panel";
import { AppointmentDetailDrawer } from "@/features/schedule/appointment-detail-drawer";
import { CreatePaymentRequestDialog } from "@/features/payment-requests/create-payment-request-dialog";
import { bookingPaymentPrefill } from "@/features/payment-requests/payment-request-prefill";
import { invalidateScheduleCache } from "@/features/schedule/use-schedule-range";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
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
import { useTenant } from "@/hooks/use-tenant";
import { Permissions } from "@/lib/auth/permissions";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentsListMeta,
  ScheduleEvent,
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
  const searchParams = useSearchParams();
  const { booking } = useTenant(tenantSlug);
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.bookings.create);
  const canUpdate = can(Permissions.bookings.update);
  const canRequestPayment = can(Permissions.payment_requests.create);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [momoOpen, setMomoOpen] = useState(false);
  const [momoPrefill, setMomoPrefill] = useState<ReturnType<typeof bookingPaymentPrefill>>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("view");
      if (param === "calendar") return "calendar";
      if (param === "list") return "list";
      return window.matchMedia("(min-width: 768px)").matches ? "calendar" : "list";
    }
    return "list";
  });
  const [calendarDate, setCalendarDate] = useState(() => startOfDay(new Date()));
  const [drawerAppointment, setDrawerAppointment] = useState<Appointment | null>(null);

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

  useEffect(() => {
    const param = searchParams.get("view");
    if (param === "calendar") setViewMode("calendar");
    else if (param === "list") setViewMode("list");
  }, [searchParams]);

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

  async function openScheduleEvent(event: ScheduleEvent) {
    if (event.type !== "appointment") return;
    const uuid = event.meta?.appointment_uuid;
    if (typeof uuid !== "string") return;
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: Appointment }>(
        `/${tenantSlug}/appointments/${uuid}`
      );
      setDrawerAppointment(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load appointment");
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
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4" />
            List
          </Button>
          <Button
            type="button"
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setViewMode("calendar")}
          >
            <LayoutGrid className="h-4 w-4" />
            Calendar
          </Button>
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
          {canCreate ? (
            <Button type="button" size="sm" className="gap-2" onClick={() => setBookingOpen(true)}>
              <Plus className="h-4 w-4" />
              New booking
            </Button>
          ) : null}
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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search client, service, staff…"
            className="min-w-[200px] flex-1"
          />
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

      {bookingOpen && canCreate ? (
        <StaffBookingPanel
          tenantSlug={tenantSlug}
          currency={currency}
          booking={booking}
          onClose={() => setBookingOpen(false)}
          onBooked={() => {
            load(true);
            invalidateScheduleCache(tenantSlug);
          }}
        />
      ) : null}

      {drawerAppointment ? (
        <AppointmentDetailDrawer
          appointment={drawerAppointment}
          currency={currency}
          canUpdate={canUpdate}
          canRequestPayment={canRequestPayment && !!bookingPaymentPrefill(drawerAppointment)}
          onClose={() => setDrawerAppointment(null)}
          onRequestPayment={() => {
            const prefill = bookingPaymentPrefill(drawerAppointment);
            if (!prefill) return;
            setMomoPrefill(prefill);
            setMomoOpen(true);
          }}
          onStatusChange={(uuid, status) => {
            void handleStatusChange(uuid, status);
            setDrawerAppointment(null);
            invalidateScheduleCache(tenantSlug);
          }}
          onReschedule={() => {
            setRescheduleId(drawerAppointment.uuid);
            setDrawerAppointment(null);
          }}
        />
      ) : null}

      {viewMode === "calendar" ? (
        <ScheduleCalendarPanel
          tenantSlug={tenantSlug}
          anchorDate={calendarDate}
          onAnchorDateChange={setCalendarDate}
          onEventClick={(event) => void openScheduleEvent(event)}
          onSlotClick={() => canCreate && setBookingOpen(true)}
        />
      ) : loading ? (
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

      <CreatePaymentRequestDialog
        tenantSlug={tenantSlug}
        currency={currency}
        open={momoOpen}
        onClose={() => {
          setMomoOpen(false);
          setMomoPrefill(null);
        }}
        prefill={momoPrefill}
      />
    </div>
  );
}
