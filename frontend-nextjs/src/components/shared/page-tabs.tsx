"use client";

import { cn } from "@/lib/utils";

export type PageTab = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

type PageTabsProps = {
  tabs: PageTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function PageTabs({ tabs, value, onChange, className }: PageTabsProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
      role="tablist"
      aria-label="Page sections"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex min-h-touch shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
