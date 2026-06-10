"use client";

import { PublicStorePage } from "@/features/store/public-store-page";

export default function TenantShopPage({ params }: { params: { tenantSlug: string } }) {
  return <PublicStorePage tenantSlug={params.tenantSlug} />;
}
