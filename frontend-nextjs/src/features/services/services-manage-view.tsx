"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { CategorySidebar } from "@/components/shared/category-sidebar";
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
import { SplitPageLayout } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";

type ServicesManageViewProps = { tenantSlug: string };

type Tab = "menu" | "gallery";

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

  const [tab, setTab] = useState<Tab>("menu");
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm());
  const [savingService, setSavingService] = useState(false);

  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm());
  const [savingCategory, setSavingCategory] = useState(false);

  const serviceCategoryFilter = useMemo(
    () => (selectedCategoryId !== "all" ? { service_category_id: selectedCategoryId } : {}),
    [selectedCategoryId]
  );

  const { items: services, meta: serviceMeta, loading: servicesLoading, reload: reloadServices } =
    usePaginatedResource<Service>({
      tenantSlug,
      path: "/services",
      search,
      activeFilter,
      page,
      extraParams: serviceCategoryFilter,
    });

  const loadAllCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: ServiceCategory[] }>(
        `/${tenantSlug}/service-categories?per_page=100`
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setAllCategories(rows);
      setCategoryOptions([
        { value: "", label: "No category" },
        ...rows.filter((c) => c.is_active).map((c) => ({ value: String(c.id), label: c.name })),
      ]);
    } catch {
      setAllCategories([]);
      setCategoryOptions([{ value: "", label: "No category" }]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadAllCategories();
  }, [loadAllCategories]);

  const totalServiceCount = useMemo(
    () => allCategories.reduce((sum, c) => sum + (c.services_count ?? 0), 0),
    [allCategories]
  );

  const sidebarItems = useMemo(
    () => [
      { id: "all", label: "All services", count: totalServiceCount },
      ...allCategories.map((c) => ({
        id: String(c.id),
        label: c.name,
        count: c.services_count ?? 0,
      })),
    ],
    [allCategories, totalServiceCount]
  );

  const selectedCategory =
    selectedCategoryId !== "all"
      ? allCategories.find((c) => String(c.id) === selectedCategoryId) ?? null
      : null;

  function openCreateService() {
    setEditingService(null);
    setServiceForm({
      ...emptyServiceForm(),
      service_category_id: selectedCategoryId !== "all" ? selectedCategoryId : "",
    });
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
      loadAllCategories();
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
      loadAllCategories();
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
      loadAllCategories();
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
      if (selectedCategoryId === String(row.id)) {
        setSelectedCategoryId("all");
      }
      loadAllCategories();
      reloadServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove category");
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "menu", label: "Service menu" },
    { id: "gallery", label: "Portfolio" },
  ];

  const categoryFooter = categoryFormOpen && (canCreate || canUpdate) ? (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        {editingCategory ? "Edit category" : "New category"}
      </p>
      <div className="space-y-2">
        <Input
          className="h-9 rounded-lg text-sm"
          placeholder="Category name"
          value={categoryForm.name}
          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
        />
        <Input
          type="number"
          className="h-9 rounded-lg text-sm"
          placeholder="Sort order"
          value={categoryForm.sort_order}
          onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value, 10) || 0 })}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={categoryForm.is_active}
            onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 flex-1 rounded-lg" onClick={saveCategory} disabled={savingCategory}>
          {savingCategory ? "Saving…" : editingCategory ? "Update" : "Create"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setCategoryFormOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  ) : selectedCategory && (canUpdate || canDelete) ? (
    <div className="flex flex-wrap gap-2">
      {canUpdate ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 rounded-lg gap-1"
          onClick={() => openEditCategory(selectedCategory)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmAction
          label="Delete"
          variant="destructive"
          confirmMessage={`Delete category "${selectedCategory.name}"?`}
          onConfirm={() => removeCategory(selectedCategory)}
        />
      ) : null}
    </div>
  ) : null;

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

      {tab === "menu" ? (
        <SplitPageLayout
          sidebar={
            <CategorySidebar
              title="Categories"
              subtitle="Filter and organize your menu"
              items={sidebarItems}
              selectedId={selectedCategoryId}
              onSelect={(id) => {
                setSelectedCategoryId(id);
                setPage(1);
              }}
              onAdd={openCreateCategory}
              addLabel="Add"
              canAdd={canCreate}
              footer={categoryFooter}
            />
          }
        >
          <Card className="w-full rounded-2xl shadow-soft">
            <CardHeader className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-accent" />
                {selectedCategory ? selectedCategory.name : "All services"}
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
                  ...(selectedCategoryId === "all"
                    ? [{ id: "category", header: "Category", cell: (r: Service) => r.category?.name ?? "—" }]
                    : []),
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
                loading={servicesLoading || categoriesLoading}
                emptyIcon={Scissors}
                emptyTitle={selectedCategory ? `No services in ${selectedCategory.name}` : "No services yet"}
                emptyDescription={
                  selectedCategory
                    ? "Add a service to this category or pick another category."
                    : "Add services clients can book online."
                }
                emptyActionLabel={canCreate ? "Add service" : undefined}
                onEmptyAction={canCreate ? openCreateService : undefined}
              />
              <CrudPagination meta={serviceMeta} page={page} onPageChange={setPage} />
            </CardContent>
          </Card>
        </SplitPageLayout>
      ) : null}

      {tab === "gallery" ? <PortfolioGallerySection tenantSlug={tenantSlug} /> : null}
    </div>
  );
}
