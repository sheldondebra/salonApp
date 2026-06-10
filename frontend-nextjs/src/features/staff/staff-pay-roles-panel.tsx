"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffPayRole, StaffPayType } from "@/lib/api/types";
import { PAY_TYPE_LABELS } from "@/features/staff/staff-ui";
import { formatMoney } from "@/lib/format/money";
import { crudRequest } from "@/features/crud/use-paginated-resource";

type StaffPayRolesPanelProps = {
  tenantSlug: string;
  currency?: string;
  canEdit: boolean;
  onChange?: () => void;
};

type RoleForm = {
  name: string;
  description: string;
  pay_type: StaffPayType;
  base_salary: string;
  hourly_rate: string;
  commission_rate: number;
  commission_type: string;
  tip_eligible: boolean;
  color: string;
  is_active: boolean;
};

const emptyRole = (): RoleForm => ({
  name: "",
  description: "",
  pay_type: "salary",
  base_salary: "",
  hourly_rate: "",
  commission_rate: 0,
  commission_type: "",
  tip_eligible: true,
  color: "#E879A6",
  is_active: true,
});

export function StaffPayRolesPanel({ tenantSlug, currency = "GHS", canEdit, onChange }: StaffPayRolesPanelProps) {
  const [roles, setRoles] = useState<StaffPayRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyRole());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: StaffPayRole[] }>(
        `/${tenantSlug}/pay-roles`
      );
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load pay roles");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditingId("new");
    setForm(emptyRole());
  }

  function startEdit(role: StaffPayRole) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description ?? "",
      pay_type: role.pay_type,
      base_salary: role.base_salary_cents ? String(role.base_salary_cents / 100) : "",
      hourly_rate: role.hourly_rate_cents ? String(role.hourly_rate_cents / 100) : "",
      commission_rate: role.commission_rate,
      commission_type: role.commission_type ?? "",
      tip_eligible: role.tip_eligible,
      color: role.color ?? "#E879A6",
      is_active: role.is_active,
    });
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description || null,
        pay_type: form.pay_type,
        base_salary_cents: Math.round(parseFloat(form.base_salary || "0") * 100) || 0,
        hourly_rate_cents: Math.round(parseFloat(form.hourly_rate || "0") * 100) || 0,
        commission_rate: form.commission_rate,
        commission_type: form.commission_type || null,
        tip_eligible: form.tip_eligible,
        color: form.color || null,
        is_active: form.is_active,
      };

      if (editingId === "new") {
        await crudRequest(tenantSlug, "post", "/pay-roles", body);
        toast.success("Pay role created");
      } else if (typeof editingId === "number") {
        await crudRequest(tenantSlug, "patch", `/pay-roles/${editingId}`, body);
        toast.success("Pay role updated");
      }
      setEditingId(null);
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save pay role");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await crudRequest(tenantSlug, "delete", `/pay-roles/${id}`);
      toast.success("Pay role removed");
      if (editingId === id) setEditingId(null);
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete pay role");
    }
  }

  if (loading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Pay roles & salary templates</h3>
          <p className="text-sm text-muted-foreground">
            Define compensation bands and apply them to staff in one click.
          </p>
        </div>
        {canEdit ? (
          <Button className="rounded-xl gap-1" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add pay role
          </Button>
        ) : null}
      </div>

      {editingId !== null ? (
        <div className="grid gap-3 rounded-2xl border border-dashed border-primary/30 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label>Role name</Label>
            <Input
              className="rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Senior stylist"
            />
          </div>
          <div className="space-y-2">
            <Label>Pay structure</Label>
            <select
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              value={form.pay_type}
              onChange={(e) => setForm({ ...form, pay_type: e.target.value as StaffPayType })}
            >
              {(Object.keys(PAY_TYPE_LABELS) as StaffPayType[]).map((key) => (
                <option key={key} value={key}>
                  {PAY_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Monthly salary ({currency})</Label>
            <Input
              type="number"
              className="rounded-xl"
              value={form.base_salary}
              onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hourly rate ({currency})</Label>
            <Input
              type="number"
              className="rounded-xl"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Commission %</Label>
            <Input
              type="number"
              className="rounded-xl"
              value={String(form.commission_rate)}
              onChange={(e) => setForm({ ...form, commission_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              className="rounded-xl"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button className="rounded-xl" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : editingId === "new" ? "Create role" : "Update role"}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {roles.length === 0 ? (
          <p className="col-span-full rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No pay roles yet. Create templates like Junior Stylist, Senior Stylist, or Receptionist.
          </p>
        ) : (
          roles.map((role) => (
            <article
              key={role.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              style={{ borderTopColor: role.color ?? undefined, borderTopWidth: role.color ? 3 : undefined }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{role.name}</p>
                  <Badge variant="outline" className="mt-1 rounded-full text-[10px]">
                    {PAY_TYPE_LABELS[role.pay_type]}
                  </Badge>
                </div>
                {canEdit ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => startEdit(role)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-destructive"
                      onClick={() => void remove(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                {role.base_salary_cents > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Salary</dt>
                    <dd className="font-medium">{formatMoney(role.base_salary_cents, currency)}/mo</dd>
                  </div>
                ) : null}
                {role.hourly_rate_cents > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Hourly</dt>
                    <dd className="font-medium">{formatMoney(role.hourly_rate_cents, currency)}/hr</dd>
                  </div>
                ) : null}
                {role.commission_rate > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Commission</dt>
                    <dd className="font-medium">{role.commission_rate}%</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Staff assigned</dt>
                  <dd className="font-medium">{role.staff_count ?? 0}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
