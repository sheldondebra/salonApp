"use client";

import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format/money";
import type { StoreProduct } from "@/lib/api/types";

type StoreProductsSectionProps = {
  products: StoreProduct[];
  currency?: string;
  compact?: boolean;
};

export function StoreProductsSection({
  products,
  currency = "USD",
  compact = false,
}: StoreProductsSectionProps) {
  if (products.length === 0) return null;

  const items = compact ? products.slice(0, 6) : products;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Retail shop</h3>
          <p className="text-sm text-muted-foreground">
            Browse salon products available for pickup or in-person purchase.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">{products.length} items available</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <Card key={product.id} className="rounded-2xl border-border/60 shadow-soft">
            <CardContent className="space-y-3 p-4">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.category?.name ?? "Retail product"}
                </p>
                {product.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{formatMoney(product.retail_cents, currency)}</p>
                  {typeof product.total_quantity === "number" ? (
                    <p className="text-xs text-muted-foreground">{product.total_quantity} in stock</p>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" className="rounded-xl">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Ask in salon
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {compact && products.length > items.length ? (
        <p className="text-center text-xs text-muted-foreground">
          +{products.length - items.length} more products in the full store
        </p>
      ) : null}
    </section>
  );
}
