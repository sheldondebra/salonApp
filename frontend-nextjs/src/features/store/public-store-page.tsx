"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { TenantBrandStyles } from "@/components/branding/tenant-brand-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicBooking } from "@/hooks/use-public-booking";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StoreProduct } from "@/lib/api/types";
import { StoreProductsSection } from "@/features/store/store-products-section";

export function PublicStorePage({ tenantSlug }: { tenantSlug: string }) {
  const { tenant, booking, loading, error } = usePublicBooking(tenantSlug);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    createApiClient(getApiClientOptions(undefined, tenantSlug))
      .get<{ data: StoreProduct[] }>(`/${tenantSlug}/store/products`)
      .then((response) => {
        if (!cancelled) {
          setProducts(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const currency = useMemo(() => tenant?.currency ?? booking?.currency ?? "USD", [booking?.currency, tenant?.currency]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20 p-6">
        <Skeleton className="mx-auto h-40 max-w-6xl rounded-3xl" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold">Store unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Workspace not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <TenantBrandStyles branding={tenant.branding}>
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20">
        <header className="border-b border-border/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
            <div>
              <Link href={`/${tenantSlug}/book`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to booking
              </Link>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{tenant.name} shop</h1>
              <p className="text-sm text-muted-foreground">Retail products available from the salon.</p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href={`/${tenantSlug}/book`}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Book a visit
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Products are shown from the live tenant catalog. Use this page to showcase retail lines between bookings.
            </CardContent>
          </Card>

          {productsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : (
            <StoreProductsSection products={products} currency={currency} />
          )}
        </main>
      </div>
    </TenantBrandStyles>
  );
}
