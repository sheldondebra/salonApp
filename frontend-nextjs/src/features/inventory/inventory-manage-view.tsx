"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, History, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/metric-card";
import { CategorySidebar } from "@/components/shared/category-sidebar";
import { SplitPageLayout } from "@/components/layout/page-layout";
import { DataTable } from "@/components/shared/data-table";
import { CrudToolbar } from "@/features/crud/crud-toolbar";
import { CrudStatusBadge } from "@/features/crud/crud-status-badge";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { usePaginatedResource } from "@/features/crud/use-paginated-resource";
import { useAbilities } from "@/hooks/use-abilities";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type {
  InventoryDashboard,
  Location,
  Product,
  ProductCategory,
  StockMovement,
  Supplier,
  SupplierContact,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

type InventoryManageViewProps = {
  tenantSlug: string;
  currency?: string;
};

type Tab = "products" | "suppliers" | "supplier_contacts" | "movements";

const emptyProductForm = () => ({
  name: "",
  sku: "",
  barcode: "",
  description: "",
  image_url: "",
  product_category_id: "",
  supplier_id: "",
  cost: "0",
  retail: "0",
  low_stock_threshold: "5",
  initial_quantity: "0",
  is_active: true,
});

const emptySupplierForm = () => ({
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  notes: "",
  is_active: true,
});

export function InventoryManageView({ tenantSlug, currency = "GHS" }: InventoryManageViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.inventory.create);
  const canUpdate = can(Permissions.inventory.update);
  const canDelete = can(Permissions.inventory.delete);

  const [tab, setTab] = useState<Tab>("products");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm());
  const [savingProduct, setSavingProduct] = useState(false);

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<"delta" | "set">("delta");
  const [adjustQty, setAdjustQty] = useState("0");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierPage] = useState(1);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm());
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (locationId) params.set("location_id", locationId);
      if (lowStockOnly) params.set("low_stock", "1");
      if (selectedCategoryId !== "all") params.set("product_category_id", selectedCategoryId);
      const res = await createApiClient(getApiClientOptions()).get<{ data: Product[] }>(
        `/${tenantSlug}/products?${params}`
      );
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [tenantSlug, debouncedSearch, page, locationId, lowStockOnly, selectedCategoryId]);

  const {
    items: suppliers,
    loading: suppliersLoading,
    reload: reloadSuppliers,
  } = usePaginatedResource<Supplier>({
    tenantSlug,
    path: "/suppliers",
    search: supplierSearch,
    page: supplierPage,
  });

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await createApiClient(getApiClientOptions()).get<InventoryDashboard>(
        `/${tenantSlug}/inventory/dashboard?${locationId ? `location_id=${locationId}` : ""}`
      );
      setDashboard(res);
    } catch {
      setDashboard(null);
    }
  }, [tenantSlug, locationId]);

  const loadMeta = useCallback(async () => {
    try {
      const [locRes, catRes] = await Promise.all([
        createApiClient(getApiClientOptions()).get<{ data: Location[] }>(
          `/${tenantSlug}/locations?per_page=50&is_active=1`
        ),
        createApiClient(getApiClientOptions()).get<{ data: ProductCategory[] }>(
          `/${tenantSlug}/product-categories?per_page=100&is_active=1`
        ),
      ]);
      setLocations(Array.isArray(locRes.data) ? locRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      if (!locationId && locRes.data?.[0]) {
        setLocationId(String(locRes.data[0].id));
      }
    } catch {
      setLocations([]);
      setCategories([]);
    }
  }, [tenantSlug, locationId]);

  const loadMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "30" });
      if (locationId) params.set("location_id", locationId);
      const res = await createApiClient(getApiClientOptions()).get<{ data: StockMovement[] }>(
        `/${tenantSlug}/stock-movements?${params}`
      );
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  }, [tenantSlug, locationId]);

  const loadSupplierContacts = useCallback(async () => {
    if (!selectedSupplierId) {
      setSupplierContacts([]);
      return;
    }
    setContactsLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: SupplierContact[] }>(
        `/${tenantSlug}/suppliers/${selectedSupplierId}/contacts`
      );
      setSupplierContacts(Array.isArray(res.data) ? res.data : []);
    } catch {
      try {
        const fallback = await createApiClient(getApiClientOptions()).get<{ data: SupplierContact[] }>(
          `/${tenantSlug}/supplier-contacts?supplier_id=${selectedSupplierId}`
        );
        setSupplierContacts(Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        setSupplierContacts([]);
      }
    } finally {
      setContactsLoading(false);
    }
  }, [tenantSlug, selectedSupplierId]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadDashboard();
    loadProducts();
  }, [loadDashboard, loadProducts]);

  useEffect(() => {
    if (tab === "movements") loadMovements();
  }, [tab, loadMovements]);

  useEffect(() => {
    if (!selectedSupplierId && suppliers[0]) {
      setSelectedSupplierId(String(suppliers[0].id));
    }
  }, [suppliers, selectedSupplierId]);

  useEffect(() => {
    if (tab === "supplier_contacts") void loadSupplierContacts();
  }, [tab, loadSupplierContacts]);

  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm(emptyProductForm());
    setProductFormOpen(true);
  }

  function openEditProduct(row: Product) {
    setEditingProduct(row);
    setProductForm({
      name: row.name,
      sku: row.sku ?? "",
      barcode: row.barcode ?? "",
      description: row.description ?? "",
      image_url: row.image_url ?? "",
      product_category_id: row.category?.id ? String(row.category.id) : "",
      supplier_id: row.supplier?.id ? String(row.supplier.id) : "",
      cost: (row.cost_cents / 100).toFixed(2),
      retail: (row.retail_cents / 100).toFixed(2),
      low_stock_threshold: String(row.low_stock_threshold),
      initial_quantity: "0",
      is_active: row.is_active,
    });
    setProductFormOpen(true);
  }

  async function saveProduct() {
    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSavingProduct(true);
    const payload: Record<string, unknown> = {
      name: productForm.name.trim(),
      sku: productForm.sku.trim() || null,
      barcode: productForm.barcode.trim() || null,
      description: productForm.description.trim() || null,
      image_url: productForm.image_url.trim() || null,
      product_category_id: productForm.product_category_id ? Number(productForm.product_category_id) : null,
      supplier_id: productForm.supplier_id ? Number(productForm.supplier_id) : null,
      cost_cents: Math.round(Number(productForm.cost) * 100),
      retail_cents: Math.round(Number(productForm.retail) * 100),
      low_stock_threshold: Number(productForm.low_stock_threshold),
      is_active: productForm.is_active,
    };
    if (!editingProduct && locationId && Number(productForm.initial_quantity) > 0) {
      payload.initial_stock = [
        { location_id: Number(locationId), quantity: Number(productForm.initial_quantity) },
      ];
    }
    try {
      const client = createApiClient(getApiClientOptions());
      if (editingProduct) {
        await client.patch(`/${tenantSlug}/products/${editingProduct.id}`, payload);
        toast.success("Product updated");
      } else {
        await client.post(`/${tenantSlug}/products`, payload);
        toast.success("Product created");
      }
      setProductFormOpen(false);
      loadProducts();
      loadDashboard();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save product");
    } finally {
      setSavingProduct(false);
    }
  }

  async function deactivateProduct(row: Product) {
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/products/${row.id}`);
      toast.success("Product deactivated");
      loadProducts();
      loadDashboard();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not deactivate");
    }
  }

  async function submitAdjust() {
    if (!adjustProduct || !locationId) return;
    setAdjusting(true);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/products/${adjustProduct.id}/adjust-stock`,
        {
          location_id: Number(locationId),
          mode: adjustMode,
          quantity: Number(adjustQty),
          reason: adjustReason || undefined,
        }
      );
      toast.success("Stock updated");
      setAdjustProduct(null);
      loadProducts();
      loadDashboard();
      loadMovements();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  }

  function openCreateSupplier() {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm());
    setSupplierFormOpen(true);
  }

  function openEditSupplier(row: Supplier) {
    setEditingSupplier(row);
    setSupplierForm({
      name: row.name,
      contact_name: row.contact_name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      notes: row.notes ?? "",
      is_active: row.is_active,
    });
    setSupplierFormOpen(true);
  }

  async function saveSupplier() {
    if (!supplierForm.name.trim()) return;
    setSavingSupplier(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const payload = { ...supplierForm, name: supplierForm.name.trim() };
      if (editingSupplier) {
        await client.patch(`/${tenantSlug}/suppliers/${editingSupplier.id}`, payload);
        toast.success("Supplier updated");
      } else {
        await client.post(`/${tenantSlug}/suppliers`, payload);
        toast.success("Supplier created");
      }
      setSupplierFormOpen(false);
      reloadSuppliers();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save supplier");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function saveSupplierContact() {
    if (!selectedSupplierId || !contactForm.name.trim()) {
      toast.error("Choose a supplier and contact name");
      return;
    }
    setSavingContact(true);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/suppliers/${selectedSupplierId}/contacts`,
        {
          name: contactForm.name.trim(),
          role: contactForm.role || null,
          email: contactForm.email || null,
          phone: contactForm.phone || null,
          notes: contactForm.notes || null,
          is_primary: contactForm.is_primary,
        }
      );
      toast.success("Supplier contact saved");
      setContactForm({
        name: "",
        role: "",
        email: "",
        phone: "",
        notes: "",
        is_primary: false,
      });
      await loadSupplierContacts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save contact");
    } finally {
      setSavingContact(false);
    }
  }

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Products, stock levels, suppliers, and movement history.
          </p>
        </div>
        <div className="min-w-[12rem]">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.length === 0 ? (
              <option value="">Default branch</option>
            ) : (
              locations.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Products" value={String(summary?.active_products ?? 0)} icon={Package} />
        <MetricCard
          title="Units in stock"
          value={String(summary?.total_units ?? 0)}
          hint={formatMoney(summary?.stock_value_cents ?? 0, currency) + " cost value"}
          icon={Package}
        />
        <MetricCard
          title="Low stock"
          value={String(summary?.low_stock_count ?? 0)}
          icon={AlertTriangle}
        />
        <MetricCard title="Total SKUs" value={String(summary?.total_products ?? 0)} icon={Package} />
      </div>

      {(dashboard?.low_stock?.length ?? 0) > 0 ? (
        <Card className="border-amber-200/60 bg-amber-50/50 shadow-soft dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              Low stock alerts
            </CardTitle>
            <CardDescription>Products at or below their threshold for this branch.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {dashboard?.low_stock.map((p) => (
              <Badge key={p.id} variant="outline" className="rounded-full">
                {p.name} · {p.quantity} left (min {p.low_stock_threshold})
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
        {(["products", "suppliers", "supplier_contacts", "movements"] as Tab[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? "default" : "ghost"}
            className="rounded-full capitalize"
            onClick={() => setTab(t)}
          >
            {t.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {tab === "products" ? (
        <SplitPageLayout
          sidebar={
            categories.length > 0 ? (
              <CategorySidebar
                title="Categories"
                subtitle="Filter your product catalog"
                items={[
                  { id: "all", label: "All products" },
                  ...categories.map((c) => ({ id: String(c.id), label: c.name })),
                ]}
                selectedId={selectedCategoryId}
                onSelect={(id) => {
                  setSelectedCategoryId(id);
                  setPage(1);
                }}
              />
            ) : undefined
          }
        >
          <div className="w-full space-y-4 min-w-0">
          <div className="flex flex-col gap-3">
            <CrudToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Search name, SKU, barcode…"
              activeFilter=""
              onActiveFilterChange={() => {}}
              onAdd={canCreate ? openCreateProduct : undefined}
              addLabel="Add product"
            />
            <Button
              type="button"
              size="sm"
              variant={lowStockOnly ? "default" : "outline"}
              className="w-fit rounded-full"
              onClick={() => {
                setLowStockOnly((v) => !v);
                setPage(1);
              }}
            >
              Low stock only
            </Button>
          </div>

          {productFormOpen ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">
                  {editingProduct ? "Edit product" : "Add product"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input className="mt-1 rounded-xl" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input className="mt-1 rounded-xl font-mono" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input className="mt-1 rounded-xl font-mono" value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <select className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm" value={productForm.product_category_id} onChange={(e) => setProductForm({ ...productForm, product_category_id: e.target.value })}>
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <select className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm" value={productForm.supplier_id} onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}>
                    <option value="">None</option>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Cost ({currency})</Label>
                  <Input type="number" min={0} step="0.01" className="mt-1 rounded-xl" value={productForm.cost} onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })} />
                </div>
                <div>
                  <Label>Retail ({currency})</Label>
                  <Input type="number" min={0} step="0.01" className="mt-1 rounded-xl" value={productForm.retail} onChange={(e) => setProductForm({ ...productForm, retail: e.target.value })} />
                </div>
                <div>
                  <Label>Low stock at</Label>
                  <Input type="number" min={0} className="mt-1 rounded-xl" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} />
                </div>
                {!editingProduct ? (
                  <div>
                    <Label>Initial stock (this branch)</Label>
                    <Input type="number" min={0} className="mt-1 rounded-xl" value={productForm.initial_quantity} onChange={(e) => setProductForm({ ...productForm, initial_quantity: e.target.value })} />
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <Label>Image URL</Label>
                  <Input className="mt-1 rounded-xl" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button className="rounded-xl" disabled={savingProduct} onClick={() => void saveProduct()}>
                    {savingProduct ? "Saving…" : "Save product"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setProductFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {adjustProduct ? (
            <Card className="border-primary/30 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Adjust stock — {adjustProduct.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div>
                  <Label>Mode</Label>
                  <select className="mt-1 h-10 rounded-xl border border-input bg-card px-3 text-sm" value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as "delta" | "set")}>
                    <option value="delta">Add / remove units</option>
                    <option value="set">Set exact quantity</option>
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" className="mt-1 w-28 rounded-xl" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
                </div>
                <div className="min-w-[12rem] flex-1">
                  <Label>Reason</Label>
                  <Input className="mt-1 rounded-xl" placeholder="Restock, correction…" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
                </div>
                <Button className="rounded-xl" disabled={adjusting} onClick={() => void submitAdjust()}>
                  {adjusting ? "Saving…" : "Apply"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAdjustProduct(null)}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <DataTable
            columns={[
              { id: "name", header: "Product", cell: (row) => (
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.sku || row.barcode || "—"}</p>
                </div>
              )},
              { id: "qty", header: "Stock", cell: (row) => (
                <span className={cn(row.is_low_stock && "font-medium text-amber-700")}>{row.total_quantity}</span>
              )},
              { id: "retail", header: "Retail", cell: (row) => formatMoney(row.retail_cents, currency) },
              { id: "status", header: "Status", cell: (row) => (
                row.is_low_stock ? (
                  <Badge variant="outline" className="border-amber-300 text-amber-800">Low</Badge>
                ) : (
                  <CrudStatusBadge active={row.is_active} />
                )
              )},
              { id: "actions", header: "", className: "w-48 text-right", cell: (row) => (
                <div className="flex justify-end gap-1">
                  {canUpdate ? (
                    <>
                      <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => openEditProduct(row)}>Edit</Button>
                      <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => { setAdjustProduct(row); setAdjustQty("0"); setAdjustReason(""); }}>Stock</Button>
                    </>
                  ) : null}
                  {canDelete ? (
                    <ConfirmAction label="Deactivate" confirmMessage={`Deactivate ${row.name}?`} onConfirm={() => deactivateProduct(row)} />
                  ) : null}
                </div>
              )},
            ]}
            data={products}
            rowKey={(row) => String(row.id)}
            loading={productsLoading}
            emptyIcon={Package}
            emptyTitle="No products yet"
            emptyDescription="Add your first retail or backbar item."
            emptyActionLabel={canCreate ? "Add product" : undefined}
            onEmptyAction={canCreate ? openCreateProduct : undefined}
          />
          </div>
        </SplitPageLayout>
      ) : null}

      {tab === "suppliers" ? (
        <>
          <CrudToolbar
            search={supplierSearch}
            onSearchChange={setSupplierSearch}
            searchPlaceholder="Search suppliers…"
            activeFilter=""
            onActiveFilterChange={() => {}}
            onAdd={canCreate ? openCreateSupplier : undefined}
            addLabel="Add supplier"
          />
          {supplierFormOpen ? (
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-base">{editingSupplier ? "Edit supplier" : "Add supplier"}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Name</Label><Input className="mt-1 rounded-xl" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
                <div><Label>Contact</Label><Input className="mt-1 rounded-xl" value={supplierForm.contact_name} onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input className="mt-1 rounded-xl" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button className="rounded-xl" disabled={savingSupplier} onClick={() => void saveSupplier()}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setSupplierFormOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
          <DataTable
            columns={[
              { id: "name", header: "Supplier", cell: (row) => row.name },
              { id: "contact", header: "Contact", cell: (row) => row.contact_name || row.phone || "—" },
              { id: "status", header: "Status", cell: (row) => <CrudStatusBadge active={row.is_active} /> },
              {
                id: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSupplierId(String(row.id));
                        setTab("supplier_contacts");
                      }}
                    >
                      Contacts
                    </Button>
                    {canUpdate ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditSupplier(row)}>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            data={suppliers}
            rowKey={(row) => String(row.id)}
            loading={suppliersLoading}
            emptyIcon={Truck}
            emptyTitle="No suppliers yet"
            emptyDescription="Add vendors you purchase retail or backbar stock from."
            emptyActionLabel={canCreate ? "Add supplier" : undefined}
            onEmptyAction={canCreate ? openCreateSupplier : undefined}
          />
        </>
      ) : null}

      {tab === "supplier_contacts" ? (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Supplier contacts</CardTitle>
              <CardDescription>Keep buyer, rep, and warehouse contacts attached to the supplier record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="">Choose supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contactForm.is_primary}
                  onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                />
                Primary contact
              </label>
              <Button className="w-full rounded-xl" disabled={!canUpdate || savingContact} onClick={() => void saveSupplierContact()}>
                {savingContact ? "Saving…" : "Add contact"}
              </Button>
            </CardContent>
          </Card>

          <DataTable
            columns={[
              {
                id: "name",
                header: "Contact",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.role || "Supplier contact"}</p>
                  </div>
                ),
              },
              { id: "email", header: "Email", cell: (row) => row.email || "—" },
              { id: "phone", header: "Phone", cell: (row) => row.phone || "—" },
              { id: "primary", header: "Primary", cell: (row) => (row.is_primary ? "Yes" : "No") },
            ]}
            data={supplierContacts}
            rowKey={(row) => String(row.id)}
            loading={contactsLoading}
            emptyIcon={Truck}
            emptyTitle="No supplier contacts yet"
            emptyDescription="Add the vendor reps and purchasing contacts you work with most."
          />
        </div>
      ) : null}

      {tab === "movements" ? (
        <DataTable
          columns={[
            { id: "when", header: "When", cell: (row) => new Date(row.created_at).toLocaleString() },
            { id: "product", header: "Product", cell: (row) => row.product?.name ?? "—" },
            { id: "type", header: "Type", cell: (row) => row.type },
            {
              id: "change",
              header: "Change",
              cell: (row) => (
                <span className={row.quantity_change >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {row.quantity_change >= 0 ? "+" : ""}
                  {row.quantity_change} → {row.quantity_after}
                </span>
              ),
            },
            { id: "reason", header: "Reason", cell: (row) => row.reason || "—" },
          ]}
          data={movements}
          rowKey={(row) => String(row.id)}
          loading={movementsLoading}
          emptyIcon={History}
          emptyTitle="No stock movements yet"
          emptyDescription="Adjust stock on a product to start the audit trail."
        />
      ) : null}
    </div>
  );
}
