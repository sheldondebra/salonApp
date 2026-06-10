"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { PackagesView } from "@/features/packages/packages-view";
import { Permissions } from "@/lib/auth/permissions";

export default function PackagesPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Packages"
      description="Prepaid service bundles, sales, and redemptions"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.packages.view}>
          <PackagesView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
