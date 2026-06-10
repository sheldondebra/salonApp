"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  /** Shown as card title on mobile when no custom mobileCard is provided */
  mobilePrimary?: boolean;
  /** Hidden on mobile card fallback unless mobileCard is provided */
  hideOnMobile?: boolean;
  cell: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
  caption?: string;
  /** Custom mobile card renderer; defaults to stacked column preview */
  mobileCard?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
};

function defaultMobileCard<T>(columns: DataTableColumn<T>[], row: T) {
  const primary =
    columns.find((c) => c.mobilePrimary) ??
    columns.find((c) => !c.hideOnMobile) ??
    columns[0];
  const rest = columns.filter((c) => c.id !== primary?.id && !c.hideOnMobile);

  return (
    <>
      {primary ? (
        <div className="font-semibold text-foreground">{primary.cell(row)}</div>
      ) : null}
      {rest.length > 0 ? (
        <dl className="mt-3 space-y-2">
          {rest.map((col) => (
            <div key={col.id} className="flex items-start justify-between gap-3 text-sm">
              <dt className="shrink-0 text-muted-foreground">{col.header}</dt>
              <dd className="text-right font-medium">{col.cell(row)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  className,
  caption,
  mobileCard,
  onRowClick,
}: DataTableProps<T>) {
  if (loading && data.length === 0) {
    return <TableSkeleton className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <>
      <div className={cn("space-y-3 md:hidden", loading && data.length > 0 && "pointer-events-none opacity-60", className)}>
        {data.map((row) => (
          <article
            key={rowKey(row)}
            className={cn(
              "rounded-2xl border border-border bg-card p-4 shadow-soft",
              onRowClick && "cursor-pointer active:bg-muted/30"
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            {mobileCard ? mobileCard(row) : defaultMobileCard(columns, row)}
          </article>
        ))}
      </div>

      <div
        className={cn(
          "hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-soft md:block",
          loading && data.length > 0 && "pointer-events-none opacity-60",
          className
        )}
      >
        <Table className="min-w-[32rem]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
