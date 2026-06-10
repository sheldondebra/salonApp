"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffMember, StaffWorkingHourDay, StaffWorkingHoursMeta } from "@/lib/api/types";

type StaffWorkingHoursTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  canEdit: boolean;
  allStaff?: StaffMember[];
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;

function emptyWeek(): StaffWorkingHourDay[] {
  return DAY_ORDER.map((dow) => ({
    day_of_week: dow,
    day_label: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dow - 1],
    is_working_day: dow <= 5,
    start_time: dow <= 5 ? "09:00" : null,
    end_time: dow <= 5 ? "18:00" : null,
  }));
}

export function StaffWorkingHoursTab({
  tenantSlug,
  staff,
  canEdit,
  allStaff = [],
}: StaffWorkingHoursTabProps) {
  const [days, setDays] = useState<StaffWorkingHourDay[]>(emptyWeek());
  const [meta, setMeta] = useState<StaffWorkingHoursMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyIds, setApplyIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    const client = createApiClient(getApiClientOptions());
    setLoading(true);
    try {
      const res = await client.get<{
        data: StaffWorkingHourDay[];
        meta?: StaffWorkingHoursMeta;
      }>(`/${tenantSlug}/staff-members/${staff.id}/working-hours`);
      setDays(Array.isArray(res.data) && res.data.length ? res.data : emptyWeek());
      setMeta(res.meta ?? null);
    } catch {
      toast.error("Could not load working hours");
      setDays(emptyWeek());
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, staff.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = meta?.summary;

  const otherStaff = useMemo(
    () => allStaff.filter((s) => s.id !== staff.id && s.is_active !== false),
    [allStaff, staff.id]
  );

  const updateDay = (dow: number, patch: Partial<StaffWorkingHourDay>) => {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dow ? { ...d, ...patch } : d))
    );
  };

  const save = async () => {
    const client = createApiClient(getApiClientOptions());
    setSaving(true);
    try {
      const res = await client.put<{
        data: StaffWorkingHourDay[];
        meta?: StaffWorkingHoursMeta;
      }>(`/${tenantSlug}/staff-members/${staff.id}/working-hours`, {
        location_id: staff.location_id ?? null,
        days: days.map((d) => ({
          day_of_week: d.day_of_week,
          is_working_day: d.is_working_day,
          start_time: d.is_working_day ? d.start_time : null,
          end_time: d.is_working_day ? d.end_time : null,
        })),
      });
      setDays(res.data ?? days);
      setMeta(res.meta ?? null);
      toast.success("Working hours saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const copyMondayToWeekdays = async () => {
    const client = createApiClient(getApiClientOptions());
    setSaving(true);
    try {
      const res = await client.post<{
        data: StaffWorkingHourDay[];
        meta?: StaffWorkingHoursMeta;
      }>(`/${tenantSlug}/staff-members/${staff.id}/working-hours/copy`, {
        from_day: 1,
        to_days: [2, 3, 4, 5],
      });
      setDays(res.data ?? days);
      setMeta(res.meta ?? null);
      toast.success("Copied Monday to weekdays");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Copy failed");
    } finally {
      setSaving(false);
    }
  };

  const applyToOthers = async () => {
    if (!applyIds.length) {
      toast.error("Select at least one staff member");
      return;
    }
    const client = createApiClient(getApiClientOptions());
    setSaving(true);
    try {
      await client.post(`/${tenantSlug}/staff-members/working-hours/apply`, {
        staff_ids: applyIds,
        location_id: staff.location_id ?? null,
        days: days.map((d) => ({
          day_of_week: d.day_of_week,
          is_working_day: d.is_working_day,
          start_time: d.is_working_day ? d.start_time : null,
          end_time: d.is_working_day ? d.end_time : null,
        })),
      });
      toast.success(`Schedule applied to ${applyIds.length} staff`);
      setApplyIds([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Apply failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-6">Loading schedule…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Weekly schedule
          </h3>
          {summary ? (
            <p className="text-xs text-muted-foreground mt-1">
              {summary.working_days} working days · {summary.weekly_hours}h per week
              {meta?.has_custom_schedule ? null : " · using defaults until saved"}
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <Button size="sm" variant="outline" className="rounded-lg gap-1" onClick={() => void copyMondayToWeekdays()} disabled={saving}>
            <Copy className="h-3.5 w-3.5" />
            Mon → weekdays
          </Button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {days.map((day) => (
          <li
            key={day.day_of_week}
            className="rounded-xl border border-border bg-muted/20 p-3 flex flex-wrap items-center gap-3"
          >
            <div className="w-24 shrink-0">
              <p className="text-sm font-medium">{day.day_label}</p>
              {!day.is_working_day ? (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  Off
                </Badge>
              ) : null}
            </div>
            {canEdit ? (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={day.is_working_day}
                  onChange={(e) =>
                    updateDay(day.day_of_week, {
                      is_working_day: e.target.checked,
                      start_time: e.target.checked ? day.start_time ?? "09:00" : null,
                      end_time: e.target.checked ? day.end_time ?? "18:00" : null,
                    })
                  }
                />
                Working
              </label>
            ) : null}
            {day.is_working_day ? (
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Start</Label>
                  <input
                    type="time"
                    className="mt-0.5 block rounded-lg border border-border px-2 py-1 text-sm"
                    value={day.start_time ?? "09:00"}
                    disabled={!canEdit}
                    onChange={(e) => updateDay(day.day_of_week, { start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">End</Label>
                  <input
                    type="time"
                    className="mt-0.5 block rounded-lg border border-border px-2 py-1 text-sm"
                    value={day.end_time ?? "18:00"}
                    disabled={!canEdit}
                    onChange={(e) => updateDay(day.day_of_week, { end_time: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Not working</span>
            )}
          </li>
        ))}
      </ul>

      {canEdit ? (
        <>
          <Button className="rounded-xl w-full" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save working hours"}
          </Button>

          {otherStaff.length > 0 ? (
            <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Apply this schedule to other staff</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {otherStaff.map((s) => {
                  const on = applyIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setApplyIds((prev) =>
                          on ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        on ? "border-primary bg-primary/10 text-primary" : "border-border"
                      }`}
                    >
                      {s.display_name}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg w-full"
                disabled={saving || !applyIds.length}
                onClick={() => void applyToOthers()}
              >
                Apply to selected
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
