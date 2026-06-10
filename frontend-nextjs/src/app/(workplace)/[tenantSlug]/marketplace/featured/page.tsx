"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { MarketplaceFeaturedView } from "@/features/marketplace/marketplace-featured-view";
import { Permissions } from "@/lib/auth/permissions";

export default function MarketplaceFeaturedPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Featured placements"
      description="Manage promoted listings and featured discovery inventory"
    >
      {() => (
        <RequirePermission
          tenantSlug={params.tenantSlug}
          permission={Permissions.marketplace.featured}
        >
          <MarketplaceFeaturedView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
