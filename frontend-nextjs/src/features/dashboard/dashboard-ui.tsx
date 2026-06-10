"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Hide scrollbar while keeping touch scroll — app-style carousels. */
export const dashboardScrollRow =
  "flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory";

export function DashboardHeroHeader({
  greeting,
  displayName,
  revenueLabel,
  revenueValue,
  className,
}: {
  greeting: string;
  displayName: string;
  revenueLabel: string;
  revenueValue: string;
  className?: string;
}) {
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
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-accent/15 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
          <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {displayName}
          </h1>
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

export function IconStatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string | number;
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
      </div>
    </div>
  );
}

export function DashboardStatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      {/* Mobile / small tablet: horizontal snap carousel */}
      <div className={cn(dashboardScrollRow, "-mx-4 px-4 sm:-mx-0 sm:hidden sm:px-0")}>
        {children}
      </div>
      {/* Tablet+ grid */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("w-full min-w-0 space-y-3 sm:space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardQuickActionTile({
  href,
  label,
  icon: Icon,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[5.5rem] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-4 text-center shadow-soft transition-all active:scale-95 hover:border-primary/30 hover:shadow-md sm:min-w-0 sm:snap-align-none",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-xs font-semibold leading-tight text-foreground">{label}</span>
    </Link>
  );
}

export function DashboardQuickActionsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0">
      <div className={cn(dashboardScrollRow, "-mx-4 px-4 sm:-mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0")}>
        {children}
      </div>
    </div>
  );
}

export function DashboardListRow({
  title,
  subtitle,
  trailing,
  href,
  className,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </>
  );

  if (href) {
    return (
      <li className={cn("border-b border-border/40 last:border-0", className)}>
        <Link
          href={href}
          className="flex items-center justify-between gap-3 py-3.5 transition-colors active:bg-muted/40"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/40 py-3.5 last:border-0",
        className
      )}
    >
      {inner}
    </li>
  );
}

export function ChartRangeToggle({
  value,
  onChange,
  className,
}: {
  value: "week" | "month" | "year";
  onChange: (v: "week" | "month" | "year") => void;
  className?: string;
}) {
  const options: { key: "week" | "month" | "year"; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return (
    <div
      className={cn(
        "inline-flex shrink-0 rounded-xl border border-border/60 bg-muted/40 p-1",
        className
      )}
      role="group"
      aria-label="Chart time range"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm",
            value === opt.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function DashboardPanelCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="min-w-0 flex-1 px-4 py-2 sm:px-5">{children}</div>
    </div>
  );
}
