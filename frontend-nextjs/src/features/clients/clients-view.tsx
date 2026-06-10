"use client";

import { useEffect, useState } from "react";
import { Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SplitView } from "@/components/shared/split-view";
import { StatusBadge } from "@/components/shared/status-badge";
import { CrudToolbar } from "@/features/crud/crud-toolbar";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { ClientProfilePanel } from "@/features/clients/client-profile-panel";
import { crudRequest, usePaginatedResource } from "@/features/crud/use-paginated-resource";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { CreatePaymentRequestDialog } from "@/features/payment-requests/create-payment-request-dialog";
import { clientPaymentPrefill } from "@/features/payment-requests/payment-request-prefill";
import { ApiError } from "@/lib/api/client";
import type { TenantClient } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type ClientsViewProps = { tenantSlug: string };

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  is_active: true,
});

export function ClientsView({ tenantSlug }: ClientsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.clients.create);
  const canUpdate = can(Permissions.clients.update);
  const canDelete = can(Permissions.clients.delete);
  const canRequestPayment = can(Permissions.payment_requests.create);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeClient, setActiveClient] = useState<TenantClient | null>(null);
  const [editing, setEditing] = useState<TenantClient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [momoOpen, setMomoOpen] = useState(false);
  const [momoClient, setMomoClient] = useState<TenantClient | null>(null);

  const { items, meta, loading, reload } = usePaginatedResource<TenantClient>({
    tenantSlug,
    path: "/clients",
    search,
    activeFilter,
    page,
  });

  const selectedClient = items.find((c) => c.id === selectedId) ?? activeClient;

  useEffect(() => {
    if (selectedId == null) {
      setActiveClient(null);
      return;
    }
    const match = items.find((c) => c.id === selectedId);
    if (match) setActiveClient(match);
  }, [items, selectedId]);

  function selectClient(row: TenantClient) {
    setSelectedId(row.id);
    setActiveClient(row);
  }

  function closeDetail() {
    setSelectedId(null);
    setActiveClient(null);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
    setSelectedId(null);
    setActiveClient(null);
  }

  function openEdit(row: TenantClient) {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      is_active: row.is_active,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        is_active: form.is_active,
      };
      if (editing) {
        await crudRequest(tenantSlug, "patch", `/clients/${editing.id}`, body);
        toast.success("Client updated");
      } else {
        await crudRequest(tenantSlug, "post", "/clients", body);
        toast.success("Client added");
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save client");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: TenantClient) {
    try {
      await crudRequest(tenantSlug, "delete", `/clients/${row.id}`);
      toast.success("Client removed from directory");
      if (selectedId === row.id) closeDetail();
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove client");
    }
  }

  function requestPayment(row: TenantClient) {
    setMomoClient(row);
    setMomoOpen(true);
  }

  const listPanel = (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Clients
        </CardTitle>
        <CrudToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search clients…"
          activeFilter={activeFilter}
          onActiveFilterChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
          onAdd={openCreate}
          addLabel="Add client"
          canAdd={canCreate}
        />
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {formOpen && (canCreate || canUpdate) ? (
          <div className="mx-6 mb-4 grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input className="mt-1 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                className="mt-1 rounded-xl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editing}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1 rounded-xl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
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
            {
              id: "name",
              header: "Name",
              mobilePrimary: true,
              cell: (r) => <span className="font-medium">{r.name}</span>,
            },
            { id: "email", header: "Email", cell: (r) => r.email },
            { id: "phone", header: "Phone", hideOnMobile: true, cell: (r) => r.phone ?? "—" },
            {
              id: "bookings",
              header: "Bookings",
              hideOnMobile: true,
              cell: (r) => r.appointments_count ?? 0,
            },
            {
              id: "status",
              header: "Status",
              cell: (r) => (
                <StatusBadge label={r.is_active ? "Active" : "Inactive"} tone={r.is_active ? "success" : "neutral"} />
              ),
            },
            {
              id: "actions",
              header: "",
              hideOnMobile: true,
              className: "w-24 text-right",
              cell: (r) =>
                canUpdate ? (
                  <Button variant="ghost" size="sm" className="rounded-lg gap-1" onClick={() => openEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null,
            },
          ]}
          data={items}
          rowKey={(r) => String(r.id)}
          loading={loading}
          emptyIcon={Users}
          emptyTitle="No clients yet"
          emptyDescription="Add clients to track bookings and contact details."
          emptyActionLabel={canCreate ? "Add client" : undefined}
          onEmptyAction={canCreate ? openCreate : undefined}
          onRowClick={selectClient}
          className={cn(selectedId != null && "md:border-r-0 md:rounded-r-none")}
        />
        <CrudPagination meta={meta} page={page} onPageChange={setPage} />
      </CardContent>
    </Card>
  );

  return (
    <>
      <SplitView
        showDetail={!!selectedClient}
        list={listPanel}
        detail={
          selectedClient ? (
            <ClientProfilePanel
              tenantSlug={tenantSlug}
              client={selectedClient}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canRequestPayment={canRequestPayment}
              onEdit={() => openEdit(selectedClient)}
              onRemove={() => remove(selectedClient)}
              onRequestPayment={() => requestPayment(selectedClient)}
              onClose={closeDetail}
            />
          ) : null
        }
      />

      <CreatePaymentRequestDialog
        tenantSlug={tenantSlug}
        open={momoOpen}
        onClose={() => {
          setMomoOpen(false);
          setMomoClient(null);
        }}
        prefill={momoClient ? clientPaymentPrefill(momoClient) : null}
      />
    </>
  );
}
