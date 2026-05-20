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
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <MetricGridSkeleton />
      <CardBlockSkeleton />
    </div>
  );
}
