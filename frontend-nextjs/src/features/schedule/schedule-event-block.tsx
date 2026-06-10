"use client";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/lib/api/types";
import {
  SCHEDULE_DAY_END_HOUR,
  SCHEDULE_DAY_START_HOUR,
  scheduleEventStyle,
} from "@/features/schedule/schedule-constants";

type ScheduleEventBlockProps = {
  event: ScheduleEvent;
  onClick?: (event: ScheduleEvent) => void;
  compact?: boolean;
};

export function ScheduleEventBlock({ event, onClick, compact }: ScheduleEventBlockProps) {
  const { top, height } = scheduleEventStyle(
    event.starts_at,
    event.ends_at,
    SCHEDULE_DAY_START_HOUR,
    SCHEDULE_DAY_END_HOUR
  );

  const isBreak = event.type === "break";
  const isTimeOff = event.type === "time_off";

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        "absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition hover:ring-2 hover:ring-primary/40",
        compact && "left-0.5 right-0.5 px-1.5 text-[10px]",
        isBreak && "border-dashed border-muted-foreground/40 bg-muted/60 text-muted-foreground",
        isTimeOff && "border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        !isBreak && !isTimeOff && "border-transparent text-white"
      )}
      style={{
        top,
        height,
        backgroundColor: !isBreak && !isTimeOff ? event.color ?? "#E879A6" : undefined,
      }}
    >
      <p className="truncate font-medium">{event.title}</p>
      {event.status ? (
        <p className="truncate text-[10px] opacity-80 capitalize">{event.status}</p>
      ) : null}
    </button>
  );
}
