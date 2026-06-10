"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStepIndicatorProps = {
  steps: { id: string; label: string }[];
  currentIndex: number;
};

export function BookingStepIndicator({ steps, currentIndex }: BookingStepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 px-0 sm:gap-4 lg:gap-5">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      done || active ? "bg-primary" : "bg-border"
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:h-10 sm:w-10",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-accent text-accent-foreground ring-2 ring-accent/30",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      done ? "bg-primary" : "bg-border"
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <span
                className={cn(
                  "hidden max-w-[5.5rem] truncate text-center text-[11px] font-medium uppercase tracking-wide sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm font-medium sm:hidden">
        Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
      </p>
    </div>
  );
}
