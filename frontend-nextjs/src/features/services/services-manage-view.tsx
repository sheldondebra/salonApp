"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Pencil, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/shared/data-table";
import { CrudToolbar } from "@/features/crud/crud-toolbar";
import { CrudStatusBadge } from "@/features/crud/crud-status-badge";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { PortfolioGallerySection } from "@/features/services/portfolio-gallery-section";
import { crudRequest, usePaginatedResource } from "@/features/crud/use-paginated-resource";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Service, ServiceCategory } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type ServicesManageViewProps = { tenantSlug: string };

type Tab = "services" | "categories" | "gallery";

const emptyServiceForm = () => ({
  name: "",
  description: "",
  duration_minutes: 60,
  price: "0",
  service_category_id: "",
  is_active: true,
});

const emptyCategoryForm = () => ({
  name: "",
  sort_order: 0,
  is_active: true,
});

export function ServicesManageView({ tenantSlug }: ServicesManageViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.services.create);
  const canUpdate = can(Permissions.services.update);
  const canDelete = can(Permissions.services.delete);

  const [tab, setTab] = useState<Tab>("services");
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm());
  const [savingService, setSavingService] = useState(false);

  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm());
  const [savingCategory, setSavingCategory] = useState(false);

  const { items: services, meta: serviceMeta, loading: servicesLoading, reload: reloadServices } =
    usePaginatedResource<Service>({
      tenantSlug,
      path: "/services",
      search,
      activeFilter,
      page,
    });

  const {
    items: categories,
    meta: categoryMeta,
    loading: categoriesLoading,
    reload: reloadCategories,
  } = usePaginatedResource<ServiceCategory>({
    tenantSlug,
    path: "/service-categories",
    search: catSearch,
    activeFilter: "",
    page: catPage,
  });

  const loadCategoryOptions = useCallback(async () => {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: ServiceCategory[] }>(
        `/${tenantSlug}/service-categories?per_page=100&is_active=1`
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setCategoryOptions([
        { value: "", label: "No category" },
        ...rows.map((c) => ({ value: String(c.id), label: c.name })),
      ]);
    } catch {
      setCategoryOptions([{ value: "", label: "No category" }]);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadCategoryOptions();
  }, [loadCategoryOptions, categories.length]);

  function openCreateService() {
    setEditingService(null);
    setServiceForm(emptyServiceForm());
    setServiceFormOpen(true);
  }

  function openEditService(row: Service) {
    setEditingService(row);
    setServiceForm({
      name: row.name,
      description: row.description ?? "",
      duration_minutes: row.duration_minutes,
      price: (row.price_cents / 100).toFixed(2),
      service_category_id: row.category?.id ? String(row.category.id) : "",
      is_active: row.is_active ?? true,
    });
    setServiceFormOpen(true);
  }

  async function saveService() {
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    setSavingService(true);
    try {
      const body: Record<string, unknown> = {
        name: serviceForm.name.trim(),
        description: serviceForm.description || null,
        duration_minutes: serviceForm.duration_minutes,
        price_cents: Math.round(parseFloat(serviceForm.price || "0") * 100),
        is_active: serviceForm.is_active,
      };
      if (serviceForm.service_category_id) {
        body.service_category_id = parseInt(serviceForm.service_category_id, 10);
      } else {
        body.service_category_id = null;
      }
      if (editingService) {
        await crudRequest(tenantSlug, "patch", `/services/${editingService.id}`, body);
        toast.success("Service updated");
      } else {
        await crudRequest(tenantSlug, "post", "/services", body);
        toast.success("Service created");
      }
      setServiceFormOpen(false);
      reloadServices();
      loadCategoryOptions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save service");
    } finally {
      setSavingService(false);
    }
  }

  async function deactivateService(row: Service) {
    try {
      await crudRequest(tenantSlug, "delete", `/services/${row.id}`);
      toast.success("Service deactivated");
      reloadServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not deactivate service");
    }
  }

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm());
    setCategoryFormOpen(true);
  }

  function openEditCategory(row: ServiceCategory) {
    setEditingCategory(row);
    setCategoryForm({
      name: row.name,
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
    setCategoryFormOpen(true);
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSavingCategory(true);
    try {
      const body = {
        name: categoryForm.name.trim(),
        sort_order: categoryForm.sort_order,
        is_active: categoryForm.is_active,
      };
      if (editingCategory) {
        await crudRequest(tenantSlug, "patch", `/service-categories/${editingCategory.id}`, body);
        toast.success("Category updated");
      } else {
        await crudRequest(tenantSlug, "post", "/service-categories", body);
        toast.success("Category created");
      }
      setCategoryFormOpen(false);
      reloadCategories();
      loadCategoryOptions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function removeCategory(row: ServiceCategory) {
    try {
      await crudRequest(tenantSlug, "delete", `/service-categories/${row.id}`);
      toast.success("Category removed");
      reloadCategories();
      loadCategoryOptions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove category");
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "services", label: "Services" },
    { id: "categories", label: "Categories" },
    { id: "gallery", label: "Portfolio" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "services" ? (
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-accent" />
              Service menu
            </CardTitle>
            <CrudToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search services…"
              activeFilter={activeFilter}
              onActiveFilterChange={(v) => {
                setActiveFilter(v);
                setPage(1);
              }}
              onAdd={openCreateService}
              addLabel="Add service"
              canAdd={canCreate}
            />
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {serviceFormOpen && (canCreate || canUpdate) ? (
              <div className="mx-6 mb-4 grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input className="mt-1 rounded-xl" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <textarea
                    className="mt-1 flex min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Combobox
                    className="mt-1 rounded-xl"
                    options={categoryOptions}
                    value={serviceForm.service_category_id}
                    onValueChange={(v) => setServiceForm({ ...serviceForm, service_category_id: v })}
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    className="mt-1 rounded-xl"
                    value={serviceForm.duration_minutes}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value, 10) || 60 })
                    }
                  />
                </div>
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="mt-1 rounded-xl"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button className="rounded-xl" onClick={saveService} disabled={savingService}>
                    {savingService ? "Saving…" : editingService ? "Update" : "Create"}
                  </Button>
                  <Button variant="ghost" className="rounded-xl" onClick={() => setServiceFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <DataTable
              columns={[
                { id: "name", header: "Service", cell: (r) => <span className="font-medium">{r.name}</span> },
                { id: "category", header: "Category", cell: (r) => r.category?.name ?? "—" },
                { id: "duration", header: "Duration", cell: (r) => `${r.duration_minutes} min` },
                { id: "price", header: "Price", cell: (r) => `$${r.price_formatted}` },
                { id: "status", header: "Status", cell: (r) => <CrudStatusBadge active={r.is_active ?? true} /> },
                {
                  id: "actions",
                  header: "",
                  className: "w-44 text-right",
                  cell: (r) =>
                    canUpdate || canDelete ? (
                      <div className="flex justify-end gap-1">
                        {canUpdate ? (
                          <Button variant="ghost" size="sm" className="rounded-lg gap-1" onClick={() => openEditService(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <ConfirmAction
                            label="Deactivate"
                            variant="destructive"
                            confirmMessage={`Deactivate "${r.name}"?`}
                            onConfirm={() => deactivateService(r)}
                          />
                        ) : null}
                      </div>
                    ) : null,
                },
              ]}
              data={services}
              rowKey={(r) => String(r.id)}
              loading={servicesLoading}
              emptyIcon={Scissors}
              emptyTitle="No services yet"
              emptyDescription="Add services clients can book online."
              emptyActionLabel={canCreate ? "Add service" : undefined}
              onEmptyAction={canCreate ? openCreateService : undefined}
            />
            <CrudPagination meta={serviceMeta} page={page} onPageChange={setPage} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "categories" ? (
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-accent" />
              Categories
            </CardTitle>
            <CrudToolbar
              search={catSearch}
              onSearchChange={(v) => {
                setCatSearch(v);
                setCatPage(1);
              }}
              searchPlaceholder="Search categories…"
              activeFilter=""
              onActiveFilterChange={() => {}}
              onAdd={openCreateCategory}
              addLabel="Add category"
              canAdd={canCreate}
            />
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {categoryFormOpen && (canCreate || canUpdate) ? (
              <div className="mx-6 mb-4 grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-3">
                <div>
                  <Label>Name</Label>
                  <Input className="mt-1 rounded-xl" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    className="mt-1 rounded-xl"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />
                  Active
                </label>
                <div className="flex gap-2 sm:col-span-3">
                  <Button className="rounded-xl" onClick={saveCategory} disabled={savingCategory}>
                    {savingCategory ? "Saving…" : editingCategory ? "Update" : "Create"}
                  </Button>
                  <Button variant="ghost" className="rounded-xl" onClick={() => setCategoryFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <DataTable
              columns={[
                { id: "name", header: "Category", cell: (r) => <span className="font-medium">{r.name}</span> },
                { id: "count", header: "Services", cell: (r) => r.services_count ?? 0 },
                { id: "order", header: "Order", cell: (r) => r.sort_order },
                { id: "status", header: "Status", cell: (r) => <CrudStatusBadge active={r.is_active} /> },
                {
                  id: "actions",
                  header: "",
                  className: "w-44 text-right",
                  cell: (r) =>
                    canUpdate || canDelete ? (
                      <div className="flex justify-end gap-1">
                        {canUpdate ? (
                          <Button variant="ghost" size="sm" className="rounded-lg gap-1" onClick={() => openEditCategory(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <ConfirmAction
                            label="Delete"
                            variant="destructive"
                            confirmMessage={`Delete category "${r.name}"?`}
                            onConfirm={() => removeCategory(r)}
                          />
                        ) : null}
                      </div>
                    ) : null,
                },
              ]}
              data={categories}
              rowKey={(r) => String(r.id)}
              loading={categoriesLoading}
              emptyIcon={FolderOpen}
              emptyTitle="No categories"
              emptyDescription="Group services into categories for your booking menu."
              emptyActionLabel={canCreate ? "Add category" : undefined}
              onEmptyAction={canCreate ? openCreateCategory : undefined}
            />
            <CrudPagination meta={categoryMeta} page={catPage} onPageChange={setCatPage} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "gallery" ? <PortfolioGallerySection tenantSlug={tenantSlug} /> : null}
    </div>
  );
}
