"use client";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "./use-paginated-resource";

type CrudPaginationProps = {
  meta: PaginationMeta | null;
  page: number;
  onPageChange: (page: number) => void;
};

export function CrudPagination({ meta, page, onPageChange }: CrudPaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        Page {meta.current_page} of {meta.last_page} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= meta.last_page}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
