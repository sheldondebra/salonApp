"use client";

import { addDays, format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type BookingDateStripProps = {
  value: string;
  onChange: (isoDate: string) => void;
  daysAhead?: number;
};

export function BookingDateStrip({ value, onChange, daysAhead = 14 }: BookingDateStripProps) {
  const selected = parseISO(`${value}T12:00:00`);
  const today = new Date();
  const days = Array.from({ length: daysAhead }, (_, i) => addDays(today, i));

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex gap-2 px-1">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const active = isSameDay(day, selected);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className={cn(
                "flex min-w-[3.25rem] flex-col items-center rounded-xl border px-2 py-2 text-center transition-colors",
                active
                  ? "border-primary bg-primary/15 text-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {format(day, "EEE")}
              </span>
              <span className="text-lg font-semibold leading-none">{format(day, "d")}</span>
              <span className="text-[10px] text-muted-foreground">{format(day, "MMM")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
