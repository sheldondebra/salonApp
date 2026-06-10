"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, DollarSign, Plus, Scissors, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Service, StaffMember, StaffServiceAssignment } from "@/lib/api/types";

type StaffServicesTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  canEdit: boolean;
};

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export function StaffServicesTab({ tenantSlug, staff, canEdit }: StaffServicesTabProps) {
  const [assigned, setAssigned] = useState<StaffServiceAssignment[]>([]);
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const client = createApiClient(getApiClientOptions());
    setLoading(true);
    try {
      const [assignRes, svcRes] = await Promise.all([
        client.get<{ data: StaffServiceAssignment[] }>(
          `/${tenantSlug}/staff-members/${staff.id}/services`
        ),
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
      ]);
      const rows = Array.isArray(assignRes.data) ? assignRes.data : [];
      setAssigned(rows.filter((r) => r.is_active));
      setCatalog(Array.isArray(svcRes.data) ? svcRes.data : []);
    } catch {
      toast.error("Could not load services");
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, staff.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeIds = useMemo(() => new Set(assigned.map((a) => a.service_id)), [assigned]);

  const categories = useMemo(() => {
    const map = new Map<string, Service[]>();
    const q = search.trim().toLowerCase();
    for (const svc of catalog) {
      if (q && !svc.name.toLowerCase().includes(q) && !svc.category?.name?.toLowerCase().includes(q)) {
        continue;
      }
      const key = svc.category?.name ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(svc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [catalog, search]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkAssign = async () => {
    if (!selectedIds.length) return;
    const client = createApiClient(getApiClientOptions());
    setSaving(true);
    try {
      const merged = Array.from(new Set([...Array.from(activeIds), ...selectedIds]));
      await client.put(`/${tenantSlug}/staff-members/${staff.id}/services/bulk`, {
        service_ids: merged,
        replace: true,
      });
      toast.success("Services assigned");
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (row: StaffServiceAssignment) => {
    const client = createApiClient(getApiClientOptions());
    try {
      await client.delete(
        `/${tenantSlug}/staff-members/${staff.id}/services/${row.id}`
      );
      toast.success("Service removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Remove failed");
    }
  };

  const updateCustom = async (
    row: StaffServiceAssignment,
    patch: { custom_duration_minutes?: number | null; custom_price_cents?: number | null }
  ) => {
    const client = createApiClient(getApiClientOptions());
    try {
      await client.patch(
        `/${tenantSlug}/staff-members/${staff.id}/services/${row.id}`,
        patch
      );
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-6">Loading services…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          Assigned services ({assigned.length})
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Only assigned staff appear when booking those services. Staff with no assignments can take any service.
        </p>
      </div>

      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">
          No services assigned yet. Add services below.
        </p>
      ) : (
        <ul className="space-y-3">
          {assigned.map((row) => {
            const svc = row.service;
            if (!svc) return null;
            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-muted/20 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{svc.name}</p>
                    {svc.category?.name ? (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {svc.category.name}
                      </Badge>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => void removeAssignment(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {row.effective_duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatMoney(row.effective_price_cents)}
                  </span>
                </div>
                {canEdit ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Custom duration (min)</Label>
                      <Input
                        type="number"
                        className="mt-0.5 h-8 rounded-lg text-xs"
                        placeholder={String(svc.duration_minutes)}
                        defaultValue={row.custom_duration_minutes ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          void updateCustom(row, {
                            custom_duration_minutes: v ? Number(v) : null,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Custom price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="mt-0.5 h-8 rounded-lg text-xs"
                        placeholder={(svc.price_cents / 100).toFixed(2)}
                        defaultValue={
                          row.custom_price_cents != null
                            ? (row.custom_price_cents / 100).toFixed(2)
                            : ""
                        }
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          void updateCustom(row, {
                            custom_price_cents: v
                              ? Math.round(parseFloat(v) * 100)
                              : null,
                          });
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Add services</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl"
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-4 rounded-xl border border-border p-3">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services match.</p>
            ) : (
              categories.map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((svc: Service) => {
                      const already = activeIds.has(svc.id);
                      const picked = selectedIds.includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          disabled={already}
                          onClick={() => toggleSelect(svc.id)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                            already
                              ? "opacity-40 cursor-not-allowed border-border"
                              : picked
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                          }`}
                        >
                          {svc.name}
                          {already ? " ✓" : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          <Button
            className="rounded-xl gap-1 w-full"
            disabled={!selectedIds.length || saving}
            onClick={() => void bulkAssign()}
          >
            <Plus className="h-4 w-4" />
            {saving ? "Saving…" : `Assign ${selectedIds.length || ""} service${selectedIds.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
