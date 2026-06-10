"use client";

import type { LucideIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { dashboardScrollRow } from "@/features/dashboard/dashboard-ui";

export function ReportsHero({
  periodFrom,
  periodTo,
  revenueLabel,
  revenueValue,
  bookings,
  className,
}: {
  periodFrom: string;
  periodTo: string;
  revenueLabel: string;
  revenueValue: string;
  bookings: number;
  className?: string;
}) {
  const periodLabel = formatPeriod(periodFrom, periodTo);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-5 shadow-soft sm:p-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Analytics overview</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {periodLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookings} booking{bookings === 1 ? "" : "s"} in this period
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {revenueLabel}
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {revenueValue}
          </p>
        </div>
      </div>
    </section>
  );
}

function formatPeriod(from: string, to: string) {
  try {
    const start = parseISO(from);
    const end = parseISO(to);
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
      return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
    }
    if (sameYear) {
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${from} – ${to}`;
  }
}

export function ReportsStatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[9.25rem] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-shadow active:scale-[0.98] sm:min-w-0 sm:shrink sm:active:scale-100 sm:hover:shadow-md",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ReportsStatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        dashboardScrollRow,
        "-mx-4 gap-3 px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ReportsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("w-full min-w-0 space-y-3 sm:space-y-4", className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
