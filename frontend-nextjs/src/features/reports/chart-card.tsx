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
      <div className="px-4 py-3 sm:px-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("min-h-0 w-full min-w-0 px-2 pb-3 pt-0 sm:px-3 sm:pb-4", heightClass)}>
        {isEmpty ? <ChartEmpty message={emptyMessage} /> : children}
      </div>
    </div>
  );
}
