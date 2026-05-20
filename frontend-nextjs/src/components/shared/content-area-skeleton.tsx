import { CardBlockSkeleton, MetricGridSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ContentSkeletonVariant = "default" | "table" | "dashboard" | "form" | "cards";

type ContentAreaSkeletonProps = {
  variant?: ContentSkeletonVariant;
  className?: string;
};

export function ContentAreaSkeleton({ variant = "default", className }: ContentAreaSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-8", className)} aria-busy="true" aria-label="Loading content">
        <MetricGridSkeleton count={4} />
        <CardBlockSkeleton className="h-72" />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardBlockSkeleton className="h-64" />
          <CardBlockSkeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading content">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading content">
        <Skeleton className="h-80 w-full max-w-3xl rounded-2xl" />
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)} aria-busy="true" aria-label="Loading content">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading content">
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
