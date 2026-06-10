"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, PackagePlus, Truck } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { useAbilities } from "@/hooks/use-abilities";
import { formatMoney } from "@/lib/format/money";
import type { Product, PurchaseOrder, Supplier } from "@/lib/api/types";

type PurchaseOrdersViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function PurchaseOrdersView({ tenantSlug, currency = "GHS" }: PurchaseOrdersViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.inventory.create);
  const canUpdate = can(Permissions.inventory.update);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    supplier_id: "",
    product_id: "",
    quantity_ordered: "1",
    unit_cost: "0",
    expected_at: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        client.get<{ data: PurchaseOrder[] }>(`/${tenantSlug}/purchase-orders?per_page=50`),
        client.get<{ data: Supplier[] }>(`/${tenantSlug}/suppliers?per_page=100`),
        client.get<{ data: Product[] }>(`/${tenantSlug}/products?per_page=100`),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load purchase orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPurchaseOrder() {
    if (!draft.supplier_id || !draft.product_id) {
      toast.error("Choose a supplier and product");
      return;
    }
    setSaving(true);
    try {
      const selectedProduct = products.find((product) => String(product.id) === draft.product_id);
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/purchase-orders`, {
        supplier_id: Number(draft.supplier_id),
        expected_at: draft.expected_at || null,
        notes: draft.notes || null,
        lines: [
          {
            product_id: Number(draft.product_id),
            quantity_ordered: Number(draft.quantity_ordered || 1),
            unit_cost_cents: Math.round(Number(draft.unit_cost || 0) * 100) || selectedProduct?.cost_cents || 0,
          },
        ],
      });
      toast.success("Purchase order created");
      setDraft({
        supplier_id: "",
        product_id: "",
        quantity_ordered: "1",
        unit_cost: "0",
        expected_at: "",
        notes: "",
      });
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create purchase order");
    } finally {
      setSaving(false);
    }
  }

  async function receiveOrder(order: PurchaseOrder) {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/purchase-orders/${order.id}/receive`, {
        lines: order.lines.map((line) => ({
          product_id: line.product_id,
          quantity_received: line.quantity_ordered,
        })),
      });
      toast.success("Purchase order received");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not receive purchase order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Purchase orders" value={String(orders.length)} icon={ClipboardList} />
        <MetricCard title="Open orders" value={String(orders.filter((order) => !["received", "cancelled"].includes(order.status)).length)} icon={Truck} />
        <MetricCard title="Suppliers" value={String(suppliers.length)} icon={Truck} />
        <MetricCard title="Receipts pending" value={String(orders.filter((order) => order.status === "submitted" || order.status === "partial").length)} icon={PackagePlus} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>PO builder</CardTitle>
            <CardDescription>Create a supplier order for low-stock replenishment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                value={draft.supplier_id}
                onChange={(event) => setDraft((current) => ({ ...current, supplier_id: event.target.value }))}
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
              <Label>Product</Label>
              <select
                value={draft.product_id}
                onChange={(event) => setDraft((current) => ({ ...current, product_id: event.target.value }))}
                className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">Choose product</option>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Qty ordered</Label>
                <Input type="number" min={1} value={draft.quantity_ordered} onChange={(event) => setDraft((current) => ({ ...current, quantity_ordered: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Unit cost ({currency})</Label>
                <Input type="number" min={0} step="0.01" value={draft.unit_cost} onChange={(event) => setDraft((current) => ({ ...current, unit_cost: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected delivery</Label>
              <Input type="date" value={draft.expected_at} onChange={(event) => setDraft((current) => ({ ...current, expected_at: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
            <Button className="w-full rounded-xl" disabled={!canCreate || saving} onClick={() => void createPurchaseOrder()}>
              {saving ? "Saving…" : "Create PO"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Orders to receive</CardTitle>
            <CardDescription>Track submitted orders and mark them received when stock arrives.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "number",
                  header: "PO",
                  mobilePrimary: true,
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.number}</p>
                      <p className="text-xs text-muted-foreground">{row.supplier_name ?? row.supplier?.name ?? "Supplier"}</p>
                    </div>
                  ),
                },
                {
                  id: "status",
                  header: "Status",
                  cell: (row) => row.status,
                },
                {
                  id: "value",
                  header: "Value",
                  cell: (row) => formatMoney(row.subtotal_cents, row.currency || currency),
                },
                {
                  id: "arrival",
                  header: "Expected",
                  cell: (row) => row.expected_at ? new Date(row.expected_at).toLocaleDateString() : "TBD",
                },
                {
                  id: "actions",
                  header: "",
                  className: "text-right",
                  cell: (row) => (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canUpdate || saving || ["received", "cancelled"].includes(row.status)}
                      onClick={() => void receiveOrder(row)}
                    >
                      Receive
                    </Button>
                  ),
                },
              ]}
              data={orders}
              rowKey={(row) => String(row.id)}
              loading={loading}
              emptyIcon={ClipboardList}
              emptyTitle="No purchase orders yet"
              emptyDescription="Create supplier orders here to keep retail and backbar stock replenished."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
