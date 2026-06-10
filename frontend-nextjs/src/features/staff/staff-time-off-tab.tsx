"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { invalidateScheduleCache } from "@/features/schedule/use-schedule-day";
import type { StaffMember, StaffTimeOff } from "@/lib/api/types";

type StaffTimeOffTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  canEdit: boolean;
};

export function StaffTimeOffTab({ tenantSlug, staff, canEdit }: StaffTimeOffTabProps) {
  const [rows, setRows] = useState<StaffTimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [purpose, setPurpose] = useState("vacation");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: StaffTimeOff[] }>(
        `/${tenantSlug}/staff-members/${staff.id}/time-off`
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load time off");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, staff.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!startAt || !endAt) {
      toast.error("Start and end are required");
      return;
    }
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/staff-members/${staff.id}/time-off`,
        { purpose, start_at: startAt, end_at: endAt }
      );
      toast.success("Time off added");
      setFormOpen(false);
      invalidateScheduleCache(tenantSlug);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: number) {
    try {
      await createApiClient(getApiClientOptions()).patch(
        `/${tenantSlug}/staff-members/${staff.id}/time-off/${id}`,
        { status: "cancelled" }
      );
      toast.success("Time off cancelled");
      invalidateScheduleCache(tenantSlug);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel");
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading time off…</p>;

  return (
    <div className="space-y-4 p-4">
      {canEdit ? (
        <Button size="sm" className="gap-1" onClick={() => setFormOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add time off
        </Button>
      ) : null}

      {formOpen ? (
        <div className="grid gap-3 rounded-xl border border-dashed border-border p-4">
          <div>
            <Label>Purpose</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="vacation">Vacation</option>
              <option value="sick_leave">Sick leave</option>
              <option value="personal">Personal</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="datetime-local" className="mt-1" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="datetime-local" className="mt-1" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarOff className="h-4 w-4" /> No time off on record.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <span>
                <span className="font-medium capitalize">{row.purpose.replace("_", " ")}</span>
                {" · "}
                {new Date(row.start_at).toLocaleString()} – {new Date(row.end_at).toLocaleString()}
                {" · "}
                <span className="text-muted-foreground">{row.status}</span>
              </span>
              {canEdit && row.status === "approved" ? (
                <Button variant="ghost" size="sm" onClick={() => void cancel(row.id)}>Cancel</Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
