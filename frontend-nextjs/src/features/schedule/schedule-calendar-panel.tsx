"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { LayoutGrid, LayoutList, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BranchSelect, ServiceSelect, StaffSelect } from "@/components/shared/entity-selects";
import { ScheduleAgendaView } from "@/features/schedule/schedule-agenda-view";
import { ScheduleDayView } from "@/features/schedule/schedule-day-view";
import { ScheduleWeekView } from "@/features/schedule/schedule-week-view";
import {
  filterScheduleEvents,
  type ScheduleCalendarFilters,
} from "@/features/schedule/schedule-filters";
import { useScheduleRange } from "@/features/schedule/use-schedule-range";
import { useEntityLookups } from "@/hooks/use-entity-lookups";
import { APPOINTMENT_STATUSES, STATUS_LABELS } from "@/lib/appointments/status";
import type { ScheduleEvent } from "@/lib/api/types";

export type CalendarLayout = "day" | "week" | "agenda";

type ScheduleCalendarPanelProps = {
  tenantSlug: string;
  anchorDate: Date;
  onAnchorDateChange: (date: Date) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onSlotClick?: () => void;
  /** Initial layout; agenda on narrow screens when unset */
  defaultLayout?: CalendarLayout;
};

function defaultLayoutForViewport(): CalendarLayout {
  if (typeof window === "undefined") return "day";
  if (window.matchMedia("(max-width: 767px)").matches) return "agenda";
  if (window.matchMedia("(min-width: 1024px)").matches) return "day";
  return "week";
}

export function ScheduleCalendarPanel({
  tenantSlug,
  anchorDate,
  onAnchorDateChange,
  onEventClick,
  onSlotClick,
  defaultLayout,
}: ScheduleCalendarPanelProps) {
  const [layout, setLayout] = useState<CalendarLayout>(() => defaultLayout ?? defaultLayoutForViewport());
  const [filters, setFilters] = useState<ScheduleCalendarFilters>({
    staffId: "all",
    branchId: "all",
    serviceId: "all",
    status: "all",
  });

  const { services } = useEntityLookups(tenantSlug);

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const rangeFrom = layout === "week" ? weekStart : startOfDay(anchorDate);
  const rangeTo =
    layout === "week" ? addDays(weekStart, 6) : layout === "agenda" ? addDays(startOfDay(anchorDate), 6) : startOfDay(anchorDate);

  const staffIds = filters.staffId !== "all" ? [Number(filters.staffId)] : undefined;
  const locationId = filters.branchId !== "all" ? Number(filters.branchId) : undefined;

  const { events, staff, loading, refresh } = useScheduleRange(
    tenantSlug,
    rangeFrom,
    rangeTo,
    staffIds,
    locationId
  );

  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of services.items) map.set(String(s.id), s.name);
    return map;
  }, [services.items]);

  const filteredEvents = useMemo(
    () => filterScheduleEvents(events, filters, serviceNameById),
    [events, filters, serviceNameById]
  );

  const staffForDayView = useMemo(() => {
    if (filters.staffId !== "all") {
      return staff.filter((s) => s.id === Number(filters.staffId));
    }
    return staff;
  }, [staff, filters.staffId]);

  const staffNames = useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of staff) map[s.id] = s.display_name;
    return map;
  }, [staff]);

  function goToday() {
    onAnchorDateChange(startOfDay(new Date()));
  }

  function goPrevious() {
    if (layout === "week") {
      onAnchorDateChange(subWeeks(anchorDate, 1));
    } else if (layout === "agenda") {
      onAnchorDateChange(addDays(anchorDate, -7));
    } else {
      onAnchorDateChange(addDays(anchorDate, -1));
    }
  }

  function goNext() {
    if (layout === "week") {
      onAnchorDateChange(addWeeks(anchorDate, 1));
    } else if (layout === "agenda") {
      onAnchorDateChange(addDays(anchorDate, 7));
    } else {
      onAnchorDateChange(addDays(anchorDate, 1));
    }
  }

  const rangeLabel =
    layout === "week"
      ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
      : layout === "agenda"
        ? `${format(rangeFrom, "MMM d")} – ${format(rangeTo, "MMM d, yyyy")}`
        : format(anchorDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={layout === "day" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setLayout("day")}>
            <LayoutGrid className="h-4 w-4" />
            Day
          </Button>
          <Button type="button" variant={layout === "week" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setLayout("week")}>
            <LayoutList className="h-4 w-4" />
            Week
          </Button>
          <Button type="button" variant={layout === "agenda" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setLayout("agenda")}>
            <List className="h-4 w-4" />
            Agenda
          </Button>
          <span className="hidden flex-1 sm:block" />
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goPrevious}>
            Previous
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goNext}>
            Next
          </Button>
          {layout === "day" ? (
            <Input
              type="date"
              className="w-auto rounded-xl"
              value={format(anchorDate, "yyyy-MM-dd")}
              onChange={(e) => onAnchorDateChange(startOfDay(parseISO(e.target.value)))}
            />
          ) : null}
          <span className="text-sm font-medium text-muted-foreground">{rangeLabel}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StaffSelect
            tenantSlug={tenantSlug}
            value={filters.staffId}
            onValueChange={(v) => setFilters((f) => ({ ...f, staffId: v }))}
            allowAll
            placeholder="All staff"
          />
          <BranchSelect
            tenantSlug={tenantSlug}
            value={filters.branchId}
            onValueChange={(v) => setFilters((f) => ({ ...f, branchId: v }))}
            allowAll
            placeholder="All branches"
          />
          <ServiceSelect
            tenantSlug={tenantSlug}
            value={filters.serviceId}
            onValueChange={(v) => setFilters((f) => ({ ...f, serviceId: v }))}
            allowAll
            placeholder="All services"
          />
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          >
            <SelectTrigger className="min-h-touch rounded-xl">
              <SelectValue placeholder="All statuses" />
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

      {layout === "day" ? (
        <ScheduleDayView
          events={filteredEvents}
          staff={staffForDayView}
          loading={loading}
          onEventClick={onEventClick}
          onSlotClick={() => onSlotClick?.()}
        />
      ) : null}

      {layout === "week" ? (
        <ScheduleWeekView
          weekStart={weekStart}
          events={filteredEvents}
          loading={loading}
          onEventClick={onEventClick}
          onDayClick={(day) => {
            onAnchorDateChange(day);
            setLayout("day");
          }}
        />
      ) : null}

      {layout === "agenda" ? (
        <ScheduleAgendaView
          events={filteredEvents}
          staffNames={staffNames}
          loading={loading}
          onEventClick={onEventClick}
        />
      ) : null}
    </div>
  );
}

export { invalidateScheduleCache } from "@/features/schedule/use-schedule-range";
