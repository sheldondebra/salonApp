"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionSidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  count?: number;
  accent?: string;
};

type SectionSidebarProps = {
  title: string;
  subtitle?: string;
  items: SectionSidebarItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  pathname?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function SectionSidebar({
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  pathname,
  headerAction,
  footer,
  className,
}: SectionSidebarProps) {
  const linkMode = items.some((item) => item.href);

  return (
    <aside
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft lg:w-[15.5rem]",
        className
      )}
    >
      <div className="border-b border-border/60 bg-gradient-to-b from-muted/30 to-transparent px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
            {subtitle ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          </div>
          {headerAction}
        </div>
      </div>

      <nav
        className="sidebar-scroll max-h-[min(60vh,520px)] flex-1 space-y-0.5 overflow-y-auto p-2 lg:max-h-none"
        aria-label={title}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = linkMode
            ? item.href != null &&
              (pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false))
            : selectedId === item.id;

          const inner = (
            <>
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                  aria-hidden
                />
              ) : null}
              {item.accent ? (
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50"
                  aria-hidden
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                </span>
              ) : Icon ? (
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-primary/25 text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </>
          );

          const itemClass = cn(
            "group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-all",
            active
              ? "bg-primary/15 text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          );

          if (linkMode && item.href) {
            return (
              <Link key={item.id} href={item.href} className={itemClass}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" onClick={() => onSelect?.(item.id)} className={itemClass}>
              {inner}
            </button>
          );
        })}
      </nav>

      {footer ? <div className="border-t border-border/60 bg-muted/20 p-3">{footer}</div> : null}
    </aside>
  );
}
