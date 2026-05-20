"use client";

import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReportFilterOptions, ReportFiltersState } from "./types";

type ReportsFiltersProps = {
  value: ReportFiltersState;
  options?: ReportFilterOptions;
  onChange: (next: ReportFiltersState) => void;
  onApply: () => void;
  loading?: boolean;
  showBranchStaffService?: boolean;
};

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
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
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
  const patch = (partial: Partial<ReportFiltersState>) => onChange({ ...value, ...partial });

  function setPreset(days: number) {
    const to = new Date();
    const from = subDays(to, days);
    onChange({
      ...value,
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setPreset(6)}>
          Last 7 days
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setPreset(29)}>
          Last 30 days
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setPreset(89)}>
          Last 90 days
        </Button>
      </div>
      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={value.from}
          onChange={(e) => patch({ from: e.target.value })}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => patch({ to: e.target.value })}
          className="rounded-xl"
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

      <div className="flex items-end">
        <Button type="button" className="w-full rounded-xl" onClick={onApply} disabled={loading}>
          {loading ? "Loading…" : "Apply filters"}
        </Button>
      </div>
    </div>
    </div>
  );
}
