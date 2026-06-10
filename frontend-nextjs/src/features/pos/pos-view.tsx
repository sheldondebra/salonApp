"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Smartphone,
  Package,
  Scissors,
  MapPin,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/metric-card";
import { CategorySidebar } from "@/components/shared/category-sidebar";
import { DataTable } from "@/components/shared/data-table";
import { PosCheckoutDialog } from "@/features/pos/pos-checkout-dialog";
import { PosCheckoutPanel } from "@/features/pos/pos-checkout-panel";
import {
  addAddonToCart,
  addProductToCart,
  addServiceToCart,
  cartSubtotalCents,
  cartToApiItems,
  updateCartQty,
} from "@/features/pos/pos-cart";
import { ServiceAddonPicker } from "@/features/pos/service-addon-picker";
import { usePosCheckout } from "@/features/pos/use-pos-checkout";
import type { PosCartLine, PosPaymentMethod, ServiceAddon } from "@/features/pos/pos-types";
import { CreatePaymentRequestDialog } from "@/features/payment-requests/create-payment-request-dialog";
import { posSalePaymentPrefill } from "@/features/payment-requests/payment-request-prefill";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Location, PosSummary, Product, Sale, Service, TenantClient } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";

type PosViewProps = {
  tenantSlug: string;
  currency?: string;
};

type CatalogTab = "services" | "products";

export function PosView({ tenantSlug, currency = "GHS" }: PosViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCheckout = can(Permissions.pos.create);
  const canManageInventory = can(Permissions.inventory.view);
  const canRequestPayment = can(Permissions.payment_requests.create);
  const canApplyManualDiscount = can(Permissions.finance.applyDiscount);
  const canApproveDiscount = can(Permissions.finance.approveDiscount);
  const canRequestApproval = can(Permissions.approvals.create);

  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [summary, setSummary] = useState<PosSummary | null>(null);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("products");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<TenantClient[]>([]);
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [clientUserId, setClientUserId] = useState("");
  const [appointmentUuid, setAppointmentUuid] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("cash");
  const [taxPercent, setTaxPercent] = useState("0");
  const [serviceChargePercent, setServiceChargePercent] = useState("0");
  const [tipCentsInput, setTipCentsInput] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [discountThresholdPercent, setDiscountThresholdPercent] = useState(20);
  const [approvalRequestUuid, setApprovalRequestUuid] = useState("");
  const [approvalApproved, setApprovalApproved] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [momoOpen, setMomoOpen] = useState(false);
  const [addonPickerOpen, setAddonPickerOpen] = useState(false);
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [serviceAddons, setServiceAddons] = useState<ServiceAddon[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  const tipCents = Math.max(0, Math.round((parseFloat(tipCentsInput) || 0) * 100));

  const subtotalCents = useMemo(() => cartSubtotalCents(cart), [cart]);

  const taxCents = useMemo(() => Math.round(subtotalCents * (parseFloat(taxPercent) || 0) / 100), [subtotalCents, taxPercent]);
  const serviceChargeCents = useMemo(
    () => Math.round(subtotalCents * (parseFloat(serviceChargePercent) || 0) / 100),
    [subtotalCents, serviceChargePercent]
  );

  const totalBeforeCoupon = subtotalCents + taxCents + serviceChargeCents + tipCents;

  const { completeCheckout, resetSession, serverTotals } = usePosCheckout({
    tenantSlug,
    locationId,
    cart,
    clientUserId,
    appointmentUuid,
    taxCents,
    serviceChargeCents,
    tipCents,
    couponCode,
    manualDiscountCents: Math.max(0, Math.round((parseFloat(manualDiscountInput) || 0) * 100)),
    approvalRequestUuid,
    enabled: canCheckout,
  });

  const manualDiscountCents = Math.max(0, Math.round((parseFloat(manualDiscountInput) || 0) * 100));
  const couponDiscountCents = serverTotals?.coupon_discount_cents ?? discountCents;
  const totalDiscountCents = couponDiscountCents + manualDiscountCents;
  const discountPercent =
    subtotalCents > 0 ? (totalDiscountCents / subtotalCents) * 100 : 0;
  const requiresApproval =
    subtotalCents > 0 &&
    totalDiscountCents > 0 &&
    discountPercent >= discountThresholdPercent &&
    !canApproveDiscount;
  const hasApproval = canApproveDiscount || approvalApproved;

  const totalCents = Math.max(0, totalBeforeCoupon - totalDiscountCents);

  const serviceIdsInCart = useMemo(
    () => cart.filter((l) => l.type === "service").map((l) => l.id),
    [cart]
  );

  const productCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const name = p.category?.name ?? "Uncategorized";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ id: name, label: name, count }));
  }, [products]);

  const serviceCategories = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((s) => {
      const name = s.category?.name ?? "Uncategorized";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ id: name, label: name, count }));
  }, [services]);

  const catalogCategoryItems = useMemo(() => {
    if (catalogTab === "products") {
      return [{ id: "all", label: "All products", count: products.length }, ...productCategories];
    }
    return [{ id: "all", label: "All services", count: services.length }, ...serviceCategories];
  }, [catalogTab, products.length, services.length, productCategories, serviceCategories]);

  const loadStaticMeta = useCallback(async () => {
    const client = createApiClient(getApiClientOptions());
    try {
      const [locRes, svcRes, clientRes] = await Promise.all([
        client.get<{ data: Location[] }>(`/${tenantSlug}/locations?per_page=50&is_active=1`),
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
        client.get<{ data: TenantClient[] }>(`/${tenantSlug}/clients?per_page=100&is_active=1`),
      ]);
      const locs = Array.isArray(locRes.data) ? locRes.data : [];
      setLocations(locs);
      setLocationId((prev) => prev || (locs[0] ? String(locs[0].id) : ""));
      setServices(Array.isArray(svcRes.data) ? svcRes.data : []);
      setClients(Array.isArray(clientRes.data) ? clientRes.data : []);
    } catch {
      toast.error("Could not load POS setup data");
    }
  }, [tenantSlug]);

  const loadLocationCatalog = useCallback(
    async (locId: string) => {
      if (!locId) return;
      setCatalogLoading(true);
      const client = createApiClient(getApiClientOptions());
      try {
        const [prodRes, sumRes] = await Promise.all([
          client.get<{ data: Product[] }>(
            `/${tenantSlug}/products?per_page=100&is_active=1&location_id=${locId}`
          ),
          client.get<PosSummary>(`/${tenantSlug}/pos/summary?location_id=${locId}`),
        ]);
        const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
        setProducts(prods);
        setSummary(sumRes);
        setCatalogTab(prods.length > 0 ? "products" : "services");
      } catch {
        setProducts([]);
        toast.error("Could not load products for this branch");
      } finally {
        setCatalogLoading(false);
      }
    },
    [tenantSlug]
  );

  const loadRecentSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: Sale[] }>(
        `/${tenantSlug}/sales?per_page=10`
      );
      setRecentSales(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecentSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void loadStaticMeta();
    void loadRecentSales();
  }, [loadStaticMeta, loadRecentSales]);

  useEffect(() => {
    if (locationId) void loadLocationCatalog(locationId);
  }, [locationId, loadLocationCatalog]);

  useEffect(() => {
    setDiscountCents(0);
    setCouponCode("");
    resetDiscountApproval();
  }, [cart, taxPercent, serviceChargePercent, tipCentsInput]);

  useEffect(() => {
    if (!canCheckout) return;
    void (async () => {
      try {
        const res = await createApiClient(getApiClientOptions()).get<{
          data: { threshold_percent: number };
        }>(`/${tenantSlug}/finance/discount-policy`);
        setDiscountThresholdPercent(res.data.threshold_percent);
      } catch {
        // keep default threshold
      }
    })();
  }, [tenantSlug, canCheckout]);

  useEffect(() => {
    resetDiscountApproval();
  }, [couponCode, manualDiscountInput, discountCents]);

  function addProduct(id: number, name: string, unitCents: number, maxQty?: number) {
    const { cart: next, error } = addProductToCart(cart, id, name, unitCents, maxQty);
    if (error) toast.error(error);
    else setCart(next);
  }

  async function beginAddService(service: Service) {
    setPendingService(service);
    setAddonsLoading(true);
    setAddonPickerOpen(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: ServiceAddon[] }>(
        `/${tenantSlug}/services/${service.id}/addons`
      );
      setServiceAddons(res.data ?? []);
    } catch {
      setServiceAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  }

  function finishAddService(withAddon?: ServiceAddon) {
    if (!pendingService) return;
    let next = addServiceToCart(cart, pendingService.id, pendingService.name, pendingService.price_cents);
    if (withAddon) {
      next = addAddonToCart(
        next,
        withAddon.id,
        pendingService.id,
        pendingService.name,
        withAddon.name,
        withAddon.price_cents
      );
    }
    setCart(next);
    setAddonPickerOpen(false);
    setPendingService(null);
    setServiceAddons([]);
  }

  function updateQty(key: string, delta: number) {
    const { cart: next, error } = updateCartQty(cart, key, delta);
    if (error) toast.error(error);
    else setCart(next);
  }

  function clearCart() {
    setCart([]);
    setClientUserId("");
    setAppointmentUuid("");
    setCouponCode("");
    setDiscountCents(0);
    setManualDiscountInput("");
    setApprovalRequestUuid("");
    setApprovalApproved(false);
    resetSession();
  }

  function resetDiscountApproval() {
    setApprovalRequestUuid("");
    setApprovalApproved(false);
  }

  async function refreshApprovalStatus(uuid = approvalRequestUuid) {
    if (!uuid.trim()) return false;
    try {
      const res = await createApiClient(getApiClientOptions()).get<{
        data: Array<{ uuid: string; status: string }>;
      }>(`/${tenantSlug}/approvals/inbox?type=pos_discount&per_page=50`);
      const match = res.data.find((item) => item.uuid === uuid);
      if (match?.status === "approved") {
        setApprovalApproved(true);
        return true;
      }
      setApprovalApproved(false);
      return false;
    } catch {
      return false;
    }
  }

  async function requestDiscountApproval() {
    if (!locationId || cart.length === 0) return;
    if (!canRequestApproval) {
      toast.error("You do not have permission to request discount approval.");
      return;
    }
    setRequestingApproval(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        data: { uuid: string; status: string };
      }>(`/${tenantSlug}/approvals`, {
        type: "pos_discount",
        title: `POS discount ${discountPercent.toFixed(1)}%`,
        description: `Manual discount ${formatMoney(manualDiscountCents, currency)} on ${formatMoney(subtotalCents, currency)} subtotal at checkout.`,
        payload: {
          discount_cents: totalDiscountCents,
          manual_discount_cents: manualDiscountCents,
          coupon_discount_cents: couponDiscountCents,
          subtotal_cents: subtotalCents,
          location_id: Number(locationId),
          items: cartToApiItems(cart),
        },
        is_urgent: discountPercent >= discountThresholdPercent + 10,
      });
      setApprovalRequestUuid(res.data.uuid);
      setApprovalApproved(res.data.status === "approved");
      toast.success(
        res.data.status === "approved"
          ? "Discount approved — you can complete checkout."
          : "Approval request sent to managers."
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not request approval");
    } finally {
      setRequestingApproval(false);
    }
  }

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== "all") {
      const catName = s.category?.name ?? "Uncategorized";
      if (catName !== categoryFilter) return false;
    }
    return !search.trim() ? true : s.name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all") {
      const catName = p.category?.name ?? "Uncategorized";
      if (catName !== categoryFilter) return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      (p.barcode?.toLowerCase().includes(q) ?? false)
    );
  });

  async function completeSale() {
    if (!canCheckout || cart.length === 0 || !locationId) return;
    if (requiresApproval && !hasApproval) {
      const approved = await refreshApprovalStatus();
      if (!approved) {
        toast.error("Manager approval is still required for this discount.");
        return;
      }
    }
    setCheckingOut(true);
    try {
      const sale = await completeCheckout(paymentMethod, saleNotes);
      toast.success("Sale completed");
      setReceipt(sale);
      setPaymentOpen(false);
      clearCart();
      setSaleNotes("");
      setTipCentsInput("");
      void loadRecentSales();
      void loadLocationCatalog(locationId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const errors = (err.payload as { errors?: Record<string, string[]> })?.errors;
        if (errors?.requires_approval?.includes("true")) {
          toast.error("This discount needs manager approval before checkout.");
          return;
        }
      }
      toast.error(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  async function openReceipt(saleId: number) {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: Sale }>(`/${tenantSlug}/sales/${saleId}`);
      setReceipt(res.data);
    } catch {
      toast.error("Could not load receipt");
    }
  }

  const selectedLocation = locations.find((l) => String(l.id) === locationId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Sales today"
          value={formatMoney(summary?.sales_today_cents ?? 0, currency)}
          hint={`${summary?.sales_today_count ?? 0} transactions`}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Sales this month"
          value={formatMoney(summary?.sales_month_cents ?? 0, currency)}
          hint={`${summary?.sales_month_count ?? 0} transactions`}
          icon={Receipt}
        />
        <MetricCard
          title="Products"
          value={String(summary?.inventory.active_products ?? 0)}
          hint={`${summary?.inventory.total_units ?? 0} units in stock`}
          icon={Package}
        />
        <MetricCard
          title="Low stock"
          value={String(summary?.inventory.low_stock_count ?? 0)}
          hint="At this branch"
          icon={AlertTriangle}
          className={(summary?.inventory.low_stock_count ?? 0) > 0 ? "border-amber-300/60" : undefined}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Branch
            </Label>
            <select
              className="mt-1 block min-w-[12rem] rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setCart([]);
              }}
            >
              {locations.length === 0 ? (
                <option value="">No branches</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {selectedLocation ? (
            <p className="text-sm text-muted-foreground pb-2">
              Stock and sales are scoped to <span className="font-medium text-foreground">{selectedLocation.name}</span>
            </p>
          ) : null}
        </div>
        {canManageInventory ? (
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/${tenantSlug}/inventory`}>Manage products</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="shadow-soft overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Catalog</CardTitle>
                <CardDescription>Add services or retail products to the cart</CardDescription>
              </div>
              <div className="flex gap-2">
                {(["products", "services"] as CatalogTab[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={catalogTab === t ? "default" : "outline"}
                    className="rounded-full gap-1.5 capitalize"
                    onClick={() => {
                      setCatalogTab(t);
                      setCategoryFilter("all");
                    }}
                  >
                    {t === "products" ? <Package className="h-3.5 w-3.5" /> : <Scissors className="h-3.5 w-3.5" />}
                    {t}
                    <Badge variant="secondary" className="ml-0.5 rounded-full px-1.5 text-[10px]">
                      {t === "products" ? products.length : services.length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={catalogTab === "products" ? "Search name, SKU, or barcode…" : "Search services…"}
                className="rounded-xl pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col p-0 lg:min-h-[32rem] lg:flex-row">
            {catalogCategoryItems.length > 1 ? (
              <CategorySidebar
                title="Categories"
                subtitle={catalogTab === "products" ? "Browse products" : "Browse services"}
                items={catalogCategoryItems}
                selectedId={categoryFilter}
                onSelect={setCategoryFilter}
                className="w-full shrink-0 rounded-none border-0 border-b border-border/60 shadow-none lg:w-[220px] lg:border-b-0 lg:border-r"
              />
            ) : null}
            <div className="flex-1 overflow-y-auto p-4">
            {catalogLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading catalog…</p>
            ) : catalogTab === "services" ? (
              filteredServices.length === 0 ? (
                <div className="py-12 text-center">
                  <Scissors className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 font-medium">No services</p>
                  <p className="text-sm text-muted-foreground mt-1">Add bookable services first.</p>
                  <Button className="mt-4 rounded-xl" variant="outline" asChild>
                    <Link href={`/${tenantSlug}/services`}>Go to services</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[32rem] overflow-y-auto pr-1">
                  {filteredServices.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md hover:bg-primary/5 active:scale-[0.98]"
                      onClick={() => void beginAddService(s)}
                    >
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-primary font-medium mt-2">{formatMoney(s.price_cents, currency)}</p>
                    </button>
                  ))}
                </div>
              )
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 font-medium">No products at this branch</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create products in Inventory and receive stock at {selectedLocation?.name ?? "this branch"}.
                </p>
                {canManageInventory ? (
                  <Button className="mt-4 rounded-xl" asChild>
                    <Link href={`/${tenantSlug}/inventory`}>Add products & stock</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[32rem] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const outOfStock = p.total_quantity <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={outOfStock}
                      className={cn(
                        "rounded-xl border border-border bg-card p-4 text-left transition-all",
                        outOfStock
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-primary/50 hover:shadow-md hover:bg-primary/5 active:scale-[0.98]",
                        p.is_low_stock && !outOfStock && "border-amber-300/80"
                      )}
                      onClick={() => addProduct(p.id, p.name, p.retail_cents, p.total_quantity)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug">{p.name}</p>
                        {p.is_low_stock ? (
                          <Badge variant="outline" className="shrink-0 text-[10px] border-amber-300 text-amber-800">
                            Low
                          </Badge>
                        ) : null}
                      </div>
                      {p.category?.name ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.category.name}</p>
                      ) : null}
                      <p className="text-primary font-medium mt-2">{formatMoney(p.retail_cents, currency)}</p>
                      <p className={cn("text-xs mt-1", outOfStock ? "text-destructive" : "text-muted-foreground")}>
                        {outOfStock ? "Out of stock" : `${p.total_quantity} in stock`}
                        {p.sku ? ` · ${p.sku}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        <PosCheckoutPanel
          currency={currency}
          cart={cart}
          clients={clients}
          clientUserId={clientUserId}
          onClientChange={setClientUserId}
          subtotalCents={subtotalCents}
          discountCents={totalDiscountCents}
          totalCents={totalCents}
          canCheckout={canCheckout}
          locationReady={Boolean(locationId)}
          onUpdateQty={updateQty}
          onClear={clearCart}
          onCheckout={() => setPaymentOpen(true)}
        />
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Recent sales</CardTitle>
          <CardDescription>Last 10 completed transactions at this salon</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { id: "when", header: "When", cell: (row) => new Date(row.created_at).toLocaleString() },
              { id: "number", header: "Receipt", cell: (row) => row.sale_number ?? row.uuid.slice(0, 8) },
              { id: "branch", header: "Branch", cell: (row) => row.location?.name ?? "—" },
              { id: "client", header: "Customer", cell: (row) => row.client?.name ?? "Walk-in" },
              { id: "total", header: "Total", cell: (row) => formatMoney(row.total_cents, row.currency ?? currency) },
              {
                id: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openReceipt(row.id)}>
                    <Receipt className="h-4 w-4" />
                  </Button>
                ),
              },
            ]}
            data={recentSales}
            rowKey={(row) => String(row.id)}
            loading={salesLoading}
            emptyIcon={Receipt}
            emptyTitle="No sales yet"
            emptyDescription="Complete a checkout to see sales here."
          />
        </CardContent>
      </Card>

      <PosCheckoutDialog
        open={paymentOpen}
        currency={currency}
        tenantSlug={tenantSlug}
        cartLineCount={cart.length}
        subtotalCents={subtotalCents}
        taxCents={taxCents}
        serviceChargeCents={serviceChargeCents}
        tipCents={tipCents}
        couponDiscountCents={couponDiscountCents}
        manualDiscountCents={manualDiscountCents}
        totalCents={totalCents}
        serviceIdsInCart={serviceIdsInCart}
        paymentMethod={paymentMethod}
        taxPercent={taxPercent}
        serviceChargePercent={serviceChargePercent}
        tipCentsInput={tipCentsInput}
        manualDiscountInput={manualDiscountInput}
        saleNotes={saleNotes}
        checkingOut={checkingOut}
        canApplyManualDiscount={canApplyManualDiscount}
        discountThresholdPercent={discountThresholdPercent}
        discountPercent={discountPercent}
        requiresApproval={requiresApproval}
        hasApproval={hasApproval}
        requestingApproval={requestingApproval}
        onPaymentMethodChange={setPaymentMethod}
        onTaxPercentChange={setTaxPercent}
        onServiceChargePercentChange={setServiceChargePercent}
        onTipInputChange={setTipCentsInput}
        onManualDiscountInputChange={setManualDiscountInput}
        onNotesChange={setSaleNotes}
        onCouponApplied={(code, d) => {
          setCouponCode(code);
          setDiscountCents(d);
        }}
        onCouponCleared={() => {
          setCouponCode("");
          setDiscountCents(0);
        }}
        onRequestApproval={() => void requestDiscountApproval()}
        onClose={() => setPaymentOpen(false)}
        onComplete={() => void completeSale()}
      />

      <ServiceAddonPicker
        open={addonPickerOpen}
        serviceName={pendingService?.name ?? "Service"}
        currency={currency}
        addons={serviceAddons}
        loading={addonsLoading}
        onSelectAddon={(addon) => finishAddService(addon)}
        onSkip={() => finishAddService()}
        onClose={() => {
          setAddonPickerOpen(false);
          setPendingService(null);
          setServiceAddons([]);
        }}
      />

      {receipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt {receipt.sale_number}
              </CardTitle>
              <CardDescription>{receipt.completed_at ? new Date(receipt.completed_at).toLocaleString() : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Customer:</span> {receipt.client?.name ?? "Walk-in"}
              </p>
              <p>
                <span className="text-muted-foreground">Branch:</span> {receipt.location?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Payment:</span>{" "}
                <Badge variant="outline" className="capitalize">
                  {receipt.payment_method.replace("_", " ")}
                </Badge>
              </p>
              <ul className="divide-y rounded-xl border">
                {(receipt.items ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between px-3 py-2">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.line_total_cents, receipt.currency ?? currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(receipt.subtotal_cents, receipt.currency ?? currency)}</span>
                </div>
                {receipt.discount_cents > 0 ? (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatMoney(receipt.discount_cents, receipt.currency ?? currency)}</span>
                  </div>
                ) : null}
                {receipt.tax_cents > 0 ? (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatMoney(receipt.tax_cents, receipt.currency ?? currency)}</span>
                  </div>
                ) : null}
                {receipt.service_charge_cents > 0 ? (
                  <div className="flex justify-between">
                    <span>Service charge</span>
                    <span>{formatMoney(receipt.service_charge_cents, receipt.currency ?? currency)}</span>
                  </div>
                ) : null}
                {receipt.tip_cents > 0 ? (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>{formatMoney(receipt.tip_cents, receipt.currency ?? currency)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatMoney(receipt.total_cents, receipt.currency ?? currency)}</span>
                </div>
              </div>
              <Button className="w-full rounded-xl" onClick={() => setReceipt(null)}>
                Close
              </Button>
              {canRequestPayment && posSalePaymentPrefill(receipt) ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-xl gap-2"
                  onClick={() => setMomoOpen(true)}
                >
                  <Smartphone className="h-4 w-4" />
                  Request MoMo payment
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <CreatePaymentRequestDialog
        tenantSlug={tenantSlug}
        currency={currency}
        open={momoOpen}
        onClose={() => setMomoOpen(false)}
        prefill={receipt ? posSalePaymentPrefill(receipt) : null}
      />
    </div>
  );
}
