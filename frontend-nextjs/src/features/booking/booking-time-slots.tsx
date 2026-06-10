"use client";

import { CalendarClock, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { slotReasonLabel } from "@/features/booking/booking-slot-labels";
import type { BookingTimeSlot } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type BookingTimeSlotsProps = {
  slots: BookingTimeSlot[];
  value: string;
  onChange: (time: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
  joinWaitlist: boolean;
  onJoinWaitlistChange: (value: boolean) => void;
  staffName?: string | null;
};

function WaitlistOffer({
  joinWaitlist,
  onJoinWaitlistChange,
}: {
  joinWaitlist: boolean;
  onJoinWaitlistChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 text-sm">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={joinWaitlist}
        onChange={(e) => onJoinWaitlistChange(e.target.checked)}
      />
      <span>
        <span className="font-medium text-foreground">Join the waitlist</span>
        <span className="mt-0.5 block text-muted-foreground">
          We&apos;ll notify you if a slot opens on this day — no payment required now.
        </span>
      </span>
    </label>
  );
}

export function BookingTimeSlots({
  slots,
  value,
  onChange,
  loading,
  onRefresh,
  joinWaitlist,
  onJoinWaitlistChange,
  staffName,
}: BookingTimeSlotsProps) {
  const availableCount = slots.filter((s) => s.available).length;
  const showWaitlist = slots.length === 0 || availableCount === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-accent" />
          Pick a time
        </Label>
        {onRefresh ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>
      ) : slots.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No open times for this date</p>
            <p className="text-sm text-muted-foreground">
              Try another day{staffName ? ` or choose a different team member than ${staffName}` : ""}.
            </p>
          </div>
          <WaitlistOffer joinWaitlist={joinWaitlist} onJoinWaitlistChange={onJoinWaitlistChange} />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {availableCount > 0
              ? `${availableCount} open slot${availableCount === 1 ? "" : "s"}`
              : "Fully booked on this day — try another date or join the waitlist"}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const reason = slotReasonLabel(slot.reason);
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  title={!slot.available && reason ? reason : undefined}
                  onClick={() => {
                    onChange(slot.time);
                    onJoinWaitlistChange(false);
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-sm font-medium transition-all",
                    !slot.available &&
                      "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground opacity-60",
                    slot.available &&
                      value !== slot.time &&
                      "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
                    slot.available &&
                      value === slot.time &&
                      "border-primary bg-primary text-primary-foreground shadow-sm"
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          {showWaitlist ? (
            <WaitlistOffer joinWaitlist={joinWaitlist} onJoinWaitlistChange={onJoinWaitlistChange} />
          ) : null}
        </>
      )}
    </div>
  );
}
