"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, PackagePlus, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { useAbilities } from "@/hooks/use-abilities";
import { formatMoney } from "@/lib/format/money";
import type { Product, ProductBundle } from "@/lib/api/types";

type BundlesViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function BundlesView({ tenantSlug, currency = "GHS" }: BundlesViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.inventory.create);
  const canUpdate = can(Permissions.inventory.update);
  const canDelete = can(Permissions.inventory.delete);

  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    id: "",
    name: "",
    description: "",
    price: "0",
    product_id: "",
    quantity: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [bundlesRes, productsRes] = await Promise.all([
        client.get<{ data: ProductBundle[] }>(`/${tenantSlug}/product-bundles?per_page=50`),
        client.get<{ data: Product[] }>(`/${tenantSlug}/products?per_page=100&is_active=1`),
      ]);
      setBundles(Array.isArray(bundlesRes.data) ? bundlesRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load bundles");
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveBundle() {
    if (!draft.name.trim() || !draft.product_id) {
      toast.error("Add a bundle name and one product");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price_cents: Math.round(Number(draft.price || 0) * 100),
        is_active: true,
        items: [
          {
            product_id: Number(draft.product_id),
            quantity: Number(draft.quantity || 1),
          },
        ],
      };
      const client = createApiClient(getApiClientOptions());
      if (draft.id) {
        await client.patch(`/${tenantSlug}/product-bundles/${draft.id}`, payload);
        toast.success("Bundle updated");
      } else {
        await client.post(`/${tenantSlug}/product-bundles`, payload);
        toast.success("Bundle created");
      }
      setDraft({
        id: "",
        name: "",
        description: "",
        price: "0",
        product_id: "",
        quantity: "1",
      });
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save bundle");
    } finally {
      setSaving(false);
    }
  }

  async function removeBundle(id: number) {
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/product-bundles/${id}`);
      toast.success("Bundle deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete bundle");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Bundles" value={String(bundles.length)} icon={Boxes} />
        <MetricCard title="Products ready" value={String(products.length)} icon={ShoppingBasket} />
        <MetricCard title="Bundle value" value={formatMoney(bundles.reduce((sum, bundle) => sum + bundle.price_cents, 0), currency)} icon={PackagePlus} />
        <MetricCard title="Active offers" value={String(bundles.filter((bundle) => bundle.is_active).length)} icon={Boxes} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>{draft.id ? "Edit bundle" : "Create bundle"}</CardTitle>
            <CardDescription>Package a simple retail combo for faster checkout and promotions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
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
                <Label>Quantity</Label>
                <Input type="number" min={1} value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Bundle price ({currency})</Label>
                <Input type="number" min={0} step="0.01" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="rounded-xl" disabled={!(draft.id ? canUpdate : canCreate) || saving} onClick={() => void saveBundle()}>
                {saving ? "Saving…" : draft.id ? "Update bundle" : "Create bundle"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDraft({
                id: "",
                name: "",
                description: "",
                price: "0",
                product_id: "",
                quantity: "1",
              })}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Bundle catalog</CardTitle>
            <CardDescription>Retail combinations available for checkout and public store merchandising.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "name",
                  header: "Bundle",
                  mobilePrimary: true,
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.description || "No description"}</p>
                    </div>
                  ),
                },
                { id: "items", header: "Contents", cell: (row) => row.items.map((item) => `${item.product_name} ×${item.quantity}`).join(", ") },
                { id: "price", header: "Price", cell: (row) => formatMoney(row.price_cents, currency) },
                {
                  id: "actions",
                  header: "",
                  className: "text-right",
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      {canUpdate ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDraft({
                              id: String(row.id),
                              name: row.name,
                              description: row.description ?? "",
                              price: String(row.price_cents / 100),
                              product_id: row.items[0] ? String(row.items[0].product_id) : "",
                              quantity: row.items[0] ? String(row.items[0].quantity) : "1",
                            })
                          }
                        >
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <ConfirmAction
                          label=""
                          icon={Trash2}
                          title="Delete this bundle?"
                          confirmMessage="This removes the bundle from your shop. Existing sales are not affected."
                          confirmLabel="Delete"
                          variant="ghost"
                          className="h-8 w-8 px-0"
                          onConfirm={() => removeBundle(row.id)}
                        />
                      ) : null}
                    </div>
                  ),
                },
              ]}
              data={bundles}
              rowKey={(row) => String(row.id)}
              loading={loading}
              emptyIcon={Boxes}
              emptyTitle="No bundles yet"
              emptyDescription="Create bundled product offers for promotions and basket building."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
