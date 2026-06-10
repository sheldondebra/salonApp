import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-5 w-28 rounded-full" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function MetricGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2 rounded-2xl border border-border bg-card p-4", className)}>
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function CardBlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-80 w-full rounded-2xl", className)} />;
}

/** Full dashboard loading state. */
export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 sm:space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl sm:h-36" />
      <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 min-w-[9.25rem] shrink-0 rounded-2xl sm:min-w-0" />
        ))}
      </div>
      <CardBlockSkeleton className="min-h-[280px]" />
      <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 min-w-[5.5rem] shrink-0 rounded-2xl sm:min-w-0" />
        ))}
      </div>
      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
        <CardBlockSkeleton className="min-h-[280px]" />
        <CardBlockSkeleton className="min-h-[280px]" />
      </div>
    </div>
  );
}
