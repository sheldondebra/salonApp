"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { MarketplaceCommissionsView } from "@/features/marketplace/marketplace-commissions-view";
import { Permissions } from "@/lib/auth/permissions";

export default function MarketplaceCommissionsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Marketplace commissions"
      description="Review partner revenue share and payout status"
    >
      {({ tenant }) => (
        <RequirePermission
          tenantSlug={params.tenantSlug}
          permission={Permissions.marketplace.commissions}
        >
          <MarketplaceCommissionsView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
