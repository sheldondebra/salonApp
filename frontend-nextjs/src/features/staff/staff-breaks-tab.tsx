"use client";

import { useCallback, useEffect, useState } from "react";
import { Coffee, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { invalidateScheduleCache } from "@/features/schedule/use-schedule-day";
import type { StaffBreak, StaffMember } from "@/lib/api/types";

type StaffBreaksTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  canEdit: boolean;
};

const emptyForm = () => ({
  title: "Lunch",
  break_type: "lunch",
  day_of_week: 1,
  start_time: "12:00",
  end_time: "13:00",
  repeats_weekly: true,
  date: "",
});

export function StaffBreaksTab({ tenantSlug, staff, canEdit }: StaffBreaksTabProps) {
  const [rows, setRows] = useState<StaffBreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: StaffBreak[] }>(
        `/${tenantSlug}/staff-members/${staff.id}/breaks`
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load breaks");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, staff.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      const body = {
        ...form,
        day_of_week: form.repeats_weekly ? form.day_of_week : null,
        date: form.repeats_weekly ? null : form.date || null,
      };
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/staff-members/${staff.id}/breaks`,
        body
      );
      toast.success("Break added");
      setFormOpen(false);
      setForm(emptyForm());
      invalidateScheduleCache(tenantSlug);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save break");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await createApiClient(getApiClientOptions()).delete(
        `/${tenantSlug}/staff-members/${staff.id}/breaks/${id}`
      );
      toast.success("Break removed");
      invalidateScheduleCache(tenantSlug);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete");
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading breaks…</p>;

  return (
    <div className="space-y-4 p-4">
      {canEdit ? (
        <Button size="sm" className="gap-1" onClick={() => setFormOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add break
        </Button>
      ) : null}

      {formOpen ? (
        <div className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Day</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              value={form.day_of_week}
              onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <option key={d} value={i + 1}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="time" className="mt-1" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" className="mt-1" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save break"}</Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Coffee className="h-4 w-4" /> No breaks configured.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{row.title}</span>
                {" · "}
                {row.repeats_weekly ? `Day ${row.day_of_week}` : row.date}
                {" · "}
                {row.start_time}–{row.end_time}
              </span>
              {canEdit ? (
                <Button variant="ghost" size="icon" onClick={() => void remove(row.id)} aria-label="Delete break">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
