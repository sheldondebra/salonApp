"use client";

import { useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { CrudToolbar } from "@/features/crud/crud-toolbar";
import { CrudStatusBadge } from "@/features/crud/crud-status-badge";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { crudRequest, usePaginatedResource } from "@/features/crud/use-paginated-resource";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/client";
import type { Location } from "@/lib/api/types";

type BranchesViewProps = { tenantSlug: string };

const emptyForm = () => ({
  name: "",
  address_line1: "",
  city: "",
  country: "",
  is_active: true,
});

export function BranchesView({ tenantSlug }: BranchesViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canManage = can(Permissions.settings.manage);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Location | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const { items, meta, loading, reload } = usePaginatedResource<Location>({
    tenantSlug,
    path: "/locations",
    search,
    activeFilter,
    page,
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(row: Location) {
    setEditing(row);
    setForm({
      name: row.name,
      address_line1: row.address_line1 ?? "",
      city: row.city ?? "",
      country: row.country ?? "",
      is_active: row.is_active ?? true,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        address_line1: form.address_line1 || null,
        city: form.city || null,
        country: form.country || null,
        is_active: form.is_active,
      };
      if (editing) {
        await crudRequest(tenantSlug, "patch", `/locations/${editing.id}`, body);
        toast.success("Branch updated");
      } else {
        await crudRequest(tenantSlug, "post", "/locations", body);
        toast.success("Branch created");
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save branch");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Location) {
    try {
      await crudRequest(tenantSlug, "delete", `/locations/${row.id}`);
      toast.success("Branch removed");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove branch");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Branches
          </CardTitle>
          <CrudToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search branches…"
            activeFilter={activeFilter}
            onActiveFilterChange={(v) => {
              setActiveFilter(v);
              setPage(1);
            }}
            onAdd={openCreate}
            addLabel="Add branch"
            canAdd={canManage}
          />
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-0">
          {formOpen && canManage ? (
            <div className="mx-6 mb-4 grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input className="mt-1 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Address</Label>
                <Input className="mt-1 rounded-xl" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input className="mt-1 rounded-xl" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Country</Label>
                <Input className="mt-1 rounded-xl" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button className="rounded-xl" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <DataTable
            columns={[
              { id: "name", header: "Branch", cell: (r) => <span className="font-medium">{r.name}</span> },
              {
                id: "location",
                header: "Location",
                cell: (r) => <span className="text-muted-foreground">{r.label}</span>,
              },
              {
                id: "status",
                header: "Status",
                cell: (r) => <CrudStatusBadge active={r.is_active ?? true} />,
              },
              {
                id: "actions",
                header: "",
                className: "w-40 text-right",
                cell: (r) =>
                  canManage ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <ConfirmAction
                        label="Delete"
                        variant="destructive"
                        confirmMessage={`Remove branch "${r.name}"?`}
                        onConfirm={() => remove(r)}
                      />
                    </div>
                  ) : null,
              },
            ]}
            data={items}
            rowKey={(r) => String(r.id)}
            loading={loading}
            emptyIcon={MapPin}
            emptyTitle="No branches yet"
            emptyDescription="Add your first location for multi-branch booking."
            emptyActionLabel={canManage ? "Add branch" : undefined}
            onEmptyAction={canManage ? openCreate : undefined}
          />
          <CrudPagination meta={meta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
