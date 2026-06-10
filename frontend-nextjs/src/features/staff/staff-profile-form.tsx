"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crudRequest } from "@/features/crud/use-paginated-resource";
import { ApiError } from "@/lib/api/client";
import type { StaffMember } from "@/lib/api/types";

type StaffProfileFormProps = {
  tenantSlug: string;
  staff: StaffMember | null;
  locations: { id: number; name: string }[];
  canSave: boolean;
  onSaved: () => void;
  onCancel?: () => void;
};

const emptyForm = () => ({
  display_name: "",
  title: "",
  email: "",
  phone: "",
  location_id: "",
  bio: "",
  employment_status: "active" as StaffMember["employment_status"],
  employment_type: "" as "" | "full_time" | "part_time" | "contractor",
  hire_date: "",
  color_code: "#E879A6",
  is_bookable: true,
  is_active: true,
});

export function StaffProfileForm({ tenantSlug, staff, locations, canSave, onSaved, onCancel }: StaffProfileFormProps) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!staff) {
      setForm(emptyForm());
      return;
    }
    setForm({
      display_name: staff.display_name,
      title: staff.job_title ?? staff.title ?? "",
      email: staff.user?.email ?? "",
      phone: staff.user?.phone ?? "",
      location_id: staff.location_id ? String(staff.location_id) : "",
      bio: staff.bio ?? "",
      employment_status: staff.employment_status ?? "active",
      employment_type: (staff.employment_type as typeof form.employment_type) ?? "",
      hire_date: staff.hire_date ?? "",
      color_code: staff.color_code ?? "#E879A6",
      is_bookable: staff.is_bookable ?? true,
      is_active: staff.is_active ?? true,
    });
  }, [staff]);

  async function save() {
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        display_name: form.display_name.trim(),
        title: form.title || null,
        email: form.email || undefined,
        phone: form.phone || null,
        location_id: form.location_id ? Number(form.location_id) : null,
        bio: form.bio || null,
        employment_status: form.employment_status,
        employment_type: form.employment_type || null,
        hire_date: form.hire_date || null,
        color_code: form.color_code || null,
        is_bookable: form.is_bookable,
        is_active: form.is_active,
      };
      if (staff) {
        await crudRequest(tenantSlug, "patch", `/staff-members/${staff.id}`, body);
        toast.success("Staff updated");
      } else {
        await crudRequest(tenantSlug, "post", "/staff-members", body);
        toast.success("Staff added");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>Display name</Label>
        <Input
          className="rounded-xl"
          value={form.display_name}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Job title</Label>
        <Input
          className="rounded-xl"
          value={form.title}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Branch</Label>
        <select
          disabled={!canSave}
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
          value={form.location_id}
          onChange={(e) => setForm({ ...form, location_id: e.target.value })}
        >
          <option value="">No branch</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          className="rounded-xl"
          value={form.email}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          className="rounded-xl"
          value={form.phone}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Employment type</Label>
        <select
          disabled={!canSave}
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
          value={form.employment_type}
          onChange={(e) => setForm({ ...form, employment_type: e.target.value as typeof form.employment_type })}
        >
          <option value="">—</option>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contractor">Contractor</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Employment status</Label>
        <select
          disabled={!canSave}
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
          value={form.employment_status}
          onChange={(e) =>
            setForm({ ...form, employment_status: e.target.value as StaffMember["employment_status"] })
          }
        >
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Hire date</Label>
        <Input
          type="date"
          className="rounded-xl"
          value={form.hire_date}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Calendar color</Label>
        <Input
          className="rounded-xl"
          value={form.color_code}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, color_code: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Bio</Label>
        <Input
          className="rounded-xl"
          value={form.bio}
          disabled={!canSave}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={!canSave}
          checked={form.is_bookable}
          onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })}
        />
        Bookable online
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={!canSave}
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Active account
      </label>
      {canSave ? (
        <div className="flex gap-2 sm:col-span-2">
          <Button className="rounded-xl" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : staff ? "Save profile" : "Create staff member"}
          </Button>
          {onCancel ? (
            <Button variant="ghost" className="rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
