"use client";

import { useState } from "react";
import { Pencil, UserCircle } from "lucide-react";
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
import type { StaffMember } from "@/lib/api/types";

type StaffTeamViewProps = { tenantSlug: string };

const emptyForm = () => ({
  display_name: "",
  title: "",
  email: "",
  phone: "",
  is_bookable: true,
  is_active: true,
});

export function StaffTeamView({ tenantSlug }: StaffTeamViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.staff.create);
  const canUpdate = can(Permissions.staff.update);
  const canDelete = can(Permissions.staff.delete);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const { items, meta, loading, reload } = usePaginatedResource<StaffMember>({
    tenantSlug,
    path: "/staff-members",
    search,
    activeFilter,
    page,
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(row: StaffMember) {
    setEditing(row);
    setForm({
      display_name: row.display_name,
      title: row.title ?? "",
      email: row.user?.email ?? "",
      phone: row.user?.phone ?? "",
      is_bookable: row.is_bookable ?? true,
      is_active: row.is_active ?? true,
    });
    setFormOpen(true);
  }

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
        is_bookable: form.is_bookable,
        is_active: form.is_active,
      };
      if (editing) {
        await crudRequest(tenantSlug, "patch", `/staff-members/${editing.id}`, body);
        toast.success("Staff member updated");
      } else {
        await crudRequest(tenantSlug, "post", "/staff-members", body);
        toast.success("Staff member added");
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save staff member");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(row: StaffMember) {
    try {
      await crudRequest(tenantSlug, "delete", `/staff-members/${row.id}`);
      toast.success("Staff member deactivated");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not deactivate");
    }
  }

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-accent" />
          Team
        </CardTitle>
        <CrudToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search staff…"
          activeFilter={activeFilter}
          onActiveFilterChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
          onAdd={openCreate}
          addLabel="Add staff"
          canAdd={canCreate}
        />
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {formOpen && (canCreate || canUpdate) ? (
          <div className="mx-6 mb-4 grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input className="mt-1 rounded-xl" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1 rounded-xl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" className="mt-1 rounded-xl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1 rounded-xl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_bookable} onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })} />
              Bookable online
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
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
            { id: "name", header: "Name", cell: (r) => <span className="font-medium">{r.display_name}</span> },
            { id: "title", header: "Title", cell: (r) => r.title ?? "—" },
            { id: "email", header: "Email", cell: (r) => r.user?.email ?? "—" },
            {
              id: "bookable",
              header: "Online",
              cell: (r) => (r.is_bookable ? "Yes" : "No"),
            },
            {
              id: "status",
              header: "Status",
              cell: (r) => <CrudStatusBadge active={r.is_active ?? true} />,
            },
            {
              id: "actions",
              header: "",
              className: "w-44 text-right",
              cell: (r) =>
                canUpdate || canDelete ? (
                  <div className="flex justify-end gap-1">
                    {canUpdate ? (
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <ConfirmAction
                        label="Deactivate"
                        variant="destructive"
                        confirmMessage={`Deactivate ${r.display_name}?`}
                        onConfirm={() => deactivate(r)}
                      />
                    ) : null}
                  </div>
                ) : null,
            },
          ]}
          data={items}
          rowKey={(r) => String(r.id)}
          loading={loading}
          emptyIcon={UserCircle}
          emptyTitle="No staff yet"
          emptyDescription="Add team members who can take bookings."
          emptyActionLabel={canCreate ? "Add staff" : undefined}
          onEmptyAction={canCreate ? openCreate : undefined}
        />
        <CrudPagination meta={meta} page={page} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
