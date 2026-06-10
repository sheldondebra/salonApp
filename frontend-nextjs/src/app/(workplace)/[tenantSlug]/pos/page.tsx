"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { PosView } from "@/features/pos/pos-view";
import { Permissions } from "@/lib/auth/permissions";

export default function PosPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Point of sale"
      description="Professional checkout for services and retail products"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.pos.view}>
          <PosView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
