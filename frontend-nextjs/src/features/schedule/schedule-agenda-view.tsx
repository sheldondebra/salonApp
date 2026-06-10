"use client";

import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { CalendarDays, Coffee, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/lib/api/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

type ScheduleAgendaViewProps = {
  events: ScheduleEvent[];
  staffNames: Record<number, string>;
  loading?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
};

function dayHeading(dateKey: string): string {
  const date = parseISO(dateKey);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

function eventTone(event: ScheduleEvent): "success" | "warning" | "neutral" | "info" {
  if (event.type === "break") return "neutral";
  if (event.type === "time_off") return "warning";
  if (event.status === "confirmed") return "success";
  if (event.status === "pending") return "warning";
  return "info";
}

function eventIcon(event: ScheduleEvent) {
  if (event.type === "break") return Coffee;
  if (event.type === "time_off") return Palmtree;
  return CalendarDays;
}

export function ScheduleAgendaView({
  events,
  staffNames,
  loading,
  onEventClick,
}: ScheduleAgendaViewProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading agenda…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nothing on the calendar"
        description="Try another date range or adjust your filters."
      />
    );
  }

  const grouped = new Map<string, ScheduleEvent[]>();
  for (const event of events) {
    const key = format(parseISO(event.starts_at), "yyyy-MM-dd");
    const list = grouped.get(key) ?? [];
    list.push(event);
    grouped.set(key, list);
  }

  const days = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {days.map(([dateKey, dayEvents]) => (
        <section key={dateKey}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-accent" />
            {dayHeading(dateKey)}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium normal-case">
              {dayEvents.length}
            </span>
          </h3>
          <ul className="space-y-2">
            {[...dayEvents]
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
              .map((event) => {
                const Icon = eventIcon(event);
                const start = parseISO(event.starts_at);
                const end = parseISO(event.ends_at);
                const staffName = staffNames[event.staff_member_id] ?? "Team";

                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "flex w-full min-h-touch items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition active:bg-muted/30",
                        event.type === "appointment" && "hover:border-primary/30"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          event.type === "appointment" ? "text-white" : "bg-muted text-muted-foreground"
                        )}
                        style={
                          event.type === "appointment"
                            ? { backgroundColor: event.color ?? "#E879A6" }
                            : undefined
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{event.title}</span>
                          {event.status ? (
                            <StatusBadge label={event.status} tone={eventTone(event)} />
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {format(start, "h:mm a")} – {format(end, "h:mm a")} · {staffName}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
