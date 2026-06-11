"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportsPageHeader({
  periodFrom,
  periodTo,
  bookings,
  className,
}: {
  periodFrom: string;
  periodTo: string;
  bookings: number;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {formatPeriod(periodFrom, periodTo)}
      </h1>
      <p className="text-sm text-muted-foreground">
        {bookings} booking{bookings === 1 ? "" : "s"} in this period
      </p>
    </header>
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
        "flex min-w-[8.5rem] shrink-0 snap-start items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:min-w-0 sm:shrink",
        className
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
          iconClassName
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ReportsStatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4",
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
  defaultOpen = true,
  collapsible = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className={cn("w-full min-w-0 space-y-3", className)}>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className={cn("w-full min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left shadow-soft transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn("ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}
