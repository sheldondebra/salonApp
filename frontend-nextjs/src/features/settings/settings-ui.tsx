"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SettingsNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export function SettingsNav({
  items,
  activeId,
  onSelect,
}: {
  items: SettingsNavItem[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto border-b border-border/60 bg-background/95 px-1 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="Settings sections"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
            activeId === id
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </CardHeader>
  );
}

export function SettingsToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  icon?: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3.5",
        disabled && "opacity-50"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-muted-foreground/30",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

export function SettingsSaveButton({
  saving,
  label = "Save changes",
  onClick,
  className,
}: {
  saving?: boolean;
  label?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      className={cn("rounded-xl gap-2", className)}
      disabled={saving}
      onClick={onClick}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {saving ? "Saving…" : label}
    </Button>
  );
}

export function SettingsGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}
