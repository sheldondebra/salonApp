"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/lib/api/types";
import { ScheduleEventBlock } from "@/features/schedule/schedule-event-block";
import {
  SCHEDULE_DAY_START_HOUR,
  SCHEDULE_HOUR_PX,
  formatScheduleHour,
  scheduleHours,
} from "@/features/schedule/schedule-constants";

type ScheduleWeekViewProps = {
  weekStart: Date;
  events: ScheduleEvent[];
  loading?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  onDayClick?: (day: Date) => void;
};

export function ScheduleWeekView({
  weekStart,
  events,
  loading,
  onEventClick,
  onDayClick,
}: ScheduleWeekViewProps) {
  const hours = scheduleHours();
  const gridHeight = hours.length * SCHEDULE_HOUR_PX;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading week…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `4rem repeat(7, minmax(100px, 1fr))` }}
      >
        <div className="border-r border-border bg-muted/30">
          <div className="sticky top-0 z-10 h-12 border-b border-border bg-muted/50" />
          {hours.map((h) => (
            <div
              key={h}
              className="border-b border-border/60 px-2 text-right text-[10px] text-muted-foreground"
              style={{ height: SCHEDULE_HOUR_PX }}
            >
              {formatScheduleHour(h)}
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(parseISO(e.starts_at), day));
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="relative border-r border-border last:border-r-0">
              <button
                type="button"
                className={cn(
                  "sticky top-0 z-10 flex h-12 w-full flex-col items-center justify-center border-b border-border bg-card px-1 text-center transition hover:bg-muted/40",
                  isToday && "bg-primary/10"
                )}
                onClick={() => onDayClick?.(day)}
              >
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <span className={cn("text-sm font-semibold", isToday && "text-primary")}>
                  {format(day, "d")}
                </span>
              </button>
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-border/40"
                    style={{ top: (h - SCHEDULE_DAY_START_HOUR) * SCHEDULE_HOUR_PX, height: SCHEDULE_HOUR_PX }}
                  />
                ))}
                {dayEvents.map((event) => (
                  <ScheduleEventBlock key={event.id} event={event} onClick={onEventClick} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
