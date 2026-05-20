"use client";

import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CrudToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeFilter: "" | "active" | "inactive";
  onActiveFilterChange: (value: "" | "active" | "inactive") => void;
  onAdd?: () => void;
  addLabel?: string;
  canAdd?: boolean;
};

export function CrudToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  activeFilter,
  onActiveFilterChange,
  onAdd,
  addLabel = "Add",
  canAdd = true,
}: CrudToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative min-w-[200px] flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-xl pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={activeFilter}
          onChange={(e) => onActiveFilterChange(e.target.value as "" | "active" | "inactive")}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {canAdd && onAdd ? (
          <Button className="gap-1 rounded-xl" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
