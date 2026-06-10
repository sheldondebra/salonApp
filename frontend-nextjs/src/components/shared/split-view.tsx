"use client";

import { cn } from "@/lib/utils";

type SplitViewProps = {
  list: React.ReactNode;
  detail?: React.ReactNode;
  /** When true on md+, shows the detail panel (list may shrink). */
  showDetail?: boolean;
  className?: string;
  listClassName?: string;
  detailClassName?: string;
};

/**
 * Tablet/desktop split layout: scrollable list + optional detail panel.
 * On mobile, only the list (or detail if `showDetail`) is shown full-width.
 */
export function SplitView({
  list,
  detail,
  showDetail = false,
  className,
  listClassName,
  detailClassName,
}: SplitViewProps) {
  const hasDetail = showDetail && detail;

  return (
    <div
      className={cn(
        "grid min-h-0 gap-4",
        hasDetail ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]" : "",
        className
      )}
    >
      <div className={cn(hasDetail ? "hidden md:block" : "", "min-h-0 min-w-0", listClassName)}>
        {list}
      </div>
      {hasDetail ? (
        <div className={cn("min-h-0 min-w-0", detailClassName)}>{detail}</div>
      ) : null}
    </div>
  );
}
