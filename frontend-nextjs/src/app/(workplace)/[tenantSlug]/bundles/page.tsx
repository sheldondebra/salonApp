"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { BundlesView } from "@/features/bundles/bundles-view";
import { Permissions } from "@/lib/auth/permissions";

export default function BundlesPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Bundles"
      description="Retail bundle offers for checkout and public merchandising"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.inventory.view}>
          <BundlesView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
