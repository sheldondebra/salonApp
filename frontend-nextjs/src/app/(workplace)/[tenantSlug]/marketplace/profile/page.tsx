"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { MarketplaceProfileView } from "@/features/marketplace/marketplace-profile-view";
import { Permissions } from "@/lib/auth/permissions";

export default function MarketplaceProfilePage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Marketplace profile"
      description="Manage how your salon appears in marketplace discovery"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.marketplace.manage}>
          <MarketplaceProfileView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
