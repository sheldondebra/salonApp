"use client";

import type { ScheduleEvent } from "@/lib/api/types";
import { ScheduleEventBlock } from "@/features/schedule/schedule-event-block";
import {
  SCHEDULE_DAY_START_HOUR,
  SCHEDULE_HOUR_PX,
  formatScheduleHour,
  scheduleHours,
} from "@/features/schedule/schedule-constants";

type ScheduleDayViewProps = {
  events: ScheduleEvent[];
  staff: { id: number; display_name: string; color_code?: string | null }[];
  loading?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
  onSlotClick?: (staffId: number, hour: number, minute: number) => void;
};

export function ScheduleDayView({
  events,
  staff,
  loading,
  onEventClick,
  onSlotClick,
}: ScheduleDayViewProps) {
  const hours = scheduleHours();
  const gridHeight = hours.length * SCHEDULE_HOUR_PX;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading schedule…
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="font-medium">No bookable staff</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add active, bookable team members to see the calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `4rem repeat(${staff.length}, minmax(140px, 1fr))` }}
      >
        <div className="border-r border-border bg-muted/30">
          <div className="sticky top-0 z-10 h-10 border-b border-border bg-muted/50" />
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

        {staff.map((member) => {
          const staffEvents = events.filter((e) => e.staff_member_id === member.id);

          return (
            <div key={member.id} className="relative border-r border-border last:border-r-0">
              <div className="sticky top-0 z-10 flex h-10 items-center justify-center border-b border-border bg-card px-2">
                <span className="truncate text-xs font-semibold">{member.display_name}</span>
              </div>
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="absolute left-0 right-0 border-b border-border/40 hover:bg-primary/5"
                    style={{ top: (h - SCHEDULE_DAY_START_HOUR) * SCHEDULE_HOUR_PX, height: SCHEDULE_HOUR_PX }}
                    onClick={() => onSlotClick?.(member.id, h, 0)}
                    aria-label={`Book ${member.display_name} at ${h}:00`}
                  />
                ))}
                {staffEvents.map((event) => (
                  <ScheduleEventBlock key={event.id} event={event} onClick={onEventClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
