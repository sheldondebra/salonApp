"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";

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
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="max-w-md flex-1"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={activeFilter}
          onChange={(e) => onActiveFilterChange(e.target.value as "" | "active" | "inactive")}
          className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {canAdd && onAdd ? (
          <Button className="min-h-touch gap-1 rounded-xl" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
