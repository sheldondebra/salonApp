"use client";

import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionSidebar, type SectionSidebarItem } from "@/components/shared/section-sidebar";

export type CategorySidebarItem = {
  id: string;
  label: string;
  count?: number;
  accent?: string;
};

type CategorySidebarProps = {
  title?: string;
  subtitle?: string;
  items: CategorySidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  canAdd?: boolean;
  className?: string;
  footer?: React.ReactNode;
};

export function CategorySidebar({
  title = "Categories",
  subtitle,
  items,
  selectedId,
  onSelect,
  onAdd,
  addLabel = "Add category",
  canAdd = false,
  className,
  footer,
}: CategorySidebarProps) {
  const sectionItems: SectionSidebarItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    count: item.count,
    accent: item.accent,
    icon: item.accent ? undefined : FolderOpen,
  }));

  const headerAction =
    canAdd && onAdd ? (
      <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 rounded-lg gap-1 px-2" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only">{addLabel}</span>
      </Button>
    ) : undefined;

  return (
    <SectionSidebar
      title={title}
      subtitle={subtitle}
      items={sectionItems}
      selectedId={selectedId}
      onSelect={onSelect}
      headerAction={headerAction}
      footer={footer}
      className={className}
    />
  );
}
