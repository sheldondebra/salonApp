"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReportFilterOptions, ReportFiltersState } from "./types";

type ReportsFiltersProps = {
  value: ReportFiltersState;
  options?: ReportFilterOptions;
  onChange: (next: ReportFiltersState) => void;
  onApply: (next?: ReportFiltersState) => void;
  loading?: boolean;
  showBranchStaffService?: boolean;
};

const PRESETS = [
  { days: 6, label: "7 days" },
  { days: 29, label: "30 days" },
  { days: 89, label: "90 days" },
] as const;

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm"
      >
        {children}
      </select>
    </div>
  );
}

export function ReportsFilters({
  value,
  options,
  onChange,
  onApply,
  loading,
  showBranchStaffService = true,
}: ReportsFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const patch = (partial: Partial<ReportFiltersState>) => onChange({ ...value, ...partial });

  function buildPreset(days: number): ReportFiltersState {
    const to = new Date();
    const from = subDays(to, days);
    return {
      ...value,
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
    };
  }

  function applyPreset(days: number) {
    const next = buildPreset(days);
    onChange(next);
    onApply(next);
  }

  const hasAdvancedFilters =
    showBranchStaffService &&
    options &&
    (value.location_id || value.staff_id || value.service_id || value.status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1"
          role="group"
          aria-label="Date range presets"
        >
          {PRESETS.map((preset) => {
            const presetValue = buildPreset(preset.days);
            const active = value.from === presetValue.from && value.to === presetValue.to;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => applyPreset(preset.days)}
                disabled={loading}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto rounded-xl sm:hidden"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {hasAdvancedFilters ? (
            <span className="ml-2 rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
              ON
            </span>
          ) : null}
          <ChevronDown
            className={cn("ml-1 h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
          />
        </Button>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card shadow-soft",
          !advancedOpen && "hidden sm:block"
        )}
      >
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">From</Label>
            <Input
              type="date"
              value={value.from}
              onChange={(e) => patch({ from: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">To</Label>
            <Input
              type="date"
              value={value.to}
              onChange={(e) => patch({ to: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          {showBranchStaffService && options ? (
            <>
              <SelectField label="Branch" value={value.location_id} onChange={(v) => patch({ location_id: v })}>
                <option value="">All branches</option>
                {options.locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Staff" value={value.staff_id} onChange={(v) => patch({ staff_id: v })}>
                <option value="">All staff</option>
                {options.staff.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Service" value={value.service_id} onChange={(v) => patch({ service_id: v })}>
                <option value="">All services</option>
                {options.services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Status" value={value.status} onChange={(v) => patch({ status: v })}>
                <option value="">All statuses</option>
                {options.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </SelectField>
            </>
          ) : null}

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={() => onApply()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Apply filters"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
