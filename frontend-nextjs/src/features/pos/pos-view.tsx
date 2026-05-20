"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Receipt, Search, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { ApplyCouponField } from "@/features/coupons/apply-coupon-field";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Location, Product, Sale, Service, TenantClient } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";

type PosViewProps = {
  tenantSlug: string;
  currency?: string;
};

type CatalogTab = "services" | "products";

type CartLine = {
  key: string;
  type: "service" | "product";
  id: number;
  name: string;
  unitCents: number;
  quantity: number;
};

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "other", label: "Other" },
] as const;

export function PosView({ tenantSlug, currency = "GHS" }: PosViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCheckout = can(Permissions.pos.create);

  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("services");
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<TenantClient[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientUserId, setClientUserId] = useState("");
  const [appointmentUuid, setAppointmentUuid] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["value"]>("cash");
  const [taxPercent, setTaxPercent] = useState("0");
  const [serviceChargePercent, setServiceChargePercent] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const subtotalCents = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitCents * line.quantity, 0),
    [cart]
  );

  const taxCents = useMemo(() => Math.round(subtotalCents * (parseFloat(taxPercent) || 0) / 100), [subtotalCents, taxPercent]);
  const serviceChargeCents = useMemo(
    () => Math.round(subtotalCents * (parseFloat(serviceChargePercent) || 0) / 100),
    [subtotalCents, serviceChargePercent]
  );

  const totalBeforeCoupon = subtotalCents + taxCents + serviceChargeCents;
  const totalCents = Math.max(0, totalBeforeCoupon - discountCents);

  const serviceIdsInCart = useMemo(
    () => cart.filter((l) => l.type === "service").map((l) => l.id),
    [cart]
  );

  const loadMeta = useCallback(async () => {
    const client = createApiClient(getApiClientOptions());
    try {
      const [locRes, svcRes, prodRes, clientRes] = await Promise.all([
        client.get<{ data: Location[] }>(`/${tenantSlug}/locations?per_page=50&is_active=1`),
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
        client.get<{ data: Product[] }>(`/${tenantSlug}/products?per_page=100&is_active=1`),
        client.get<{ data: TenantClient[] }>(`/${tenantSlug}/clients?per_page=100&is_active=1`),
      ]);
      const locs = Array.isArray(locRes.data) ? locRes.data : [];
      setLocations(locs);
      if (!locationId && locs[0]) setLocationId(String(locs[0].id));
      setServices(Array.isArray(svcRes.data) ? svcRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setClients(Array.isArray(clientRes.data) ? clientRes.data : []);
    } catch {
      toast.error("Could not load POS catalog");
    }
  }, [tenantSlug, locationId]);

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
    void loadMeta();
    void loadRecentSales();
  }, [loadMeta, loadRecentSales]);

  useEffect(() => {
    setDiscountCents(0);
    setCouponCode("");
  }, [cart, taxPercent, serviceChargePercent]);

  function addToCart(type: "service" | "product", id: number, name: string, unitCents: number) {
    const key = `${type}-${id}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { key, type, id, name, unitCents, quantity: 1 }];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  const filteredServices = services.filter((s) =>
    !search.trim() ? true : s.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProducts = products.filter((p) =>
    !search.trim() ? true : p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function completeSale() {
    if (!canCheckout || cart.length === 0 || !locationId) return;
    setCheckingOut(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: Sale }>(`/${tenantSlug}/sales`, {
        location_id: Number(locationId),
        client_user_id: clientUserId ? Number(clientUserId) : null,
        appointment_uuid: appointmentUuid.trim() || null,
        items: cart.map((line) => ({
          type: line.type,
          service_id: line.type === "service" ? line.id : undefined,
          product_id: line.type === "product" ? line.id : undefined,
          quantity: line.quantity,
        })),
        coupon_code: couponCode || null,
        tax_cents: taxCents,
        service_charge_cents: serviceChargeCents,
        tip_cents: 0,
        payment_method: paymentMethod,
      });
      toast.success("Sale completed");
      setReceipt(res.data);
      setPaymentOpen(false);
      setCart([]);
      setCouponCode("");
      setDiscountCents(0);
      void loadRecentSales();
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Branch</Label>
          <select
            className="mt-1 block rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Catalog</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services or products…"
                className="rounded-xl pl-9"
              />
            </div>
            <div className="flex gap-2 pt-2">
              {(["services", "products"] as CatalogTab[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={catalogTab === t ? "default" : "outline"}
                  className="rounded-full capitalize"
                  onClick={() => setCatalogTab(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 max-h-[28rem] overflow-y-auto">
            {catalogTab === "services"
              ? filteredServices.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => addToCart("service", s.id, s.name, s.price_cents)}
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatMoney(s.price_cents, currency)}</p>
                  </button>
                ))
              : filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      "rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5",
                      p.is_low_stock && "border-amber-300"
                    )}
                    onClick={() => addToCart("product", p.id, p.name, p.retail_cents)}
                  >
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMoney(p.retail_cents, currency)} · Stock {p.total_quantity}
                    </p>
                  </button>
                ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:sticky lg:top-4 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </CardTitle>
            <CardDescription>{cart.length} line{cart.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3" /> Customer
              </Label>
              <select
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={clientUserId}
                onChange={(e) => setClientUserId(e.target.value)}
              >
                <option value="">Walk-in</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Link appointment (optional)</Label>
              <Input
                className="mt-1 rounded-xl font-mono text-xs"
                value={appointmentUuid}
                onChange={(e) => setAppointmentUuid(e.target.value)}
                placeholder="Appointment UUID"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tap items to add them.</p>
              ) : (
                cart.map((line) => (
                  <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(line.unitCents, currency)} × {line.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(line.key, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{line.quantity}</span>
                      <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(line.key, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(subtotalCents, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatMoney(totalCents, currency)}</span>
              </div>
            </div>

            <Button
              className="w-full rounded-xl"
              disabled={!canCheckout || cart.length === 0 || !locationId}
              onClick={() => setPaymentOpen(true)}
            >
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Recent sales</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { id: "when", header: "When", cell: (row) => new Date(row.created_at).toLocaleString() },
              { id: "number", header: "Receipt", cell: (row) => row.sale_number ?? row.uuid.slice(0, 8) },
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

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md shadow-soft">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Record payment for this sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment method</Label>
                <select
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                >
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tax %</Label>
                  <Input className="mt-1 rounded-xl" type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
                </div>
                <div>
                  <Label>Service charge %</Label>
                  <Input
                    className="mt-1 rounded-xl"
                    type="number"
                    min={0}
                    value={serviceChargePercent}
                    onChange={(e) => setServiceChargePercent(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-2">
                Split payments and tips: coming soon — tip is recorded as 0 for now.
              </p>
              {subtotalCents > 0 ? (
                <ApplyCouponField
                  validatePath={`/${tenantSlug}/sales/validate-coupon`}
                  validateBody={{
                    amount_cents: subtotalCents,
                    service_ids: serviceIdsInCart,
                  }}
                  subtotalCents={subtotalCents}
                  currency={currency}
                  onApplied={({ code, discountCents: d }) => {
                    setCouponCode(code);
                    setDiscountCents(d);
                  }}
                  onCleared={() => {
                    setCouponCode("");
                    setDiscountCents(0);
                  }}
                />
              ) : null}
              <div className="flex justify-between font-semibold">
                <span>Amount due</span>
                <span>{formatMoney(totalCents, currency)}</span>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" disabled={checkingOut} onClick={() => void completeSale()}>
                  {checkingOut ? "Processing…" : "Complete sale"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {receipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatMoney(receipt.total_cents, receipt.currency ?? currency)}</span>
                </div>
              </div>
              <Button className="w-full rounded-xl" onClick={() => setReceipt(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
