"use client";

import { cn } from "@/lib/utils";
import { ChartEmpty } from "./chart-empty";

type ChartCardProps = {
  title: string;
  description?: string;
  heightClass?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  description,
  heightClass = "h-[220px] sm:h-[280px]",
  isEmpty = false,
  emptyMessage,
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <div className="border-b border-border/40 px-4 py-3.5 sm:px-5">
        <h4 className="text-sm font-semibold text-foreground sm:text-base">{title}</h4>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
        ) : null}
      </div>
      <div className={cn("min-h-0 w-full min-w-0 px-2 pb-3 pt-2 sm:px-3 sm:pb-4", heightClass)}>
        {isEmpty ? <ChartEmpty message={emptyMessage} /> : children}
      </div>
    </div>
  );
}
