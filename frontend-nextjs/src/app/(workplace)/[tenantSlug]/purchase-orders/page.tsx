"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { PurchaseOrdersView } from "@/features/purchase-orders/purchase-orders-view";
import { Permissions } from "@/lib/auth/permissions";

export default function PurchaseOrdersPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Purchase orders"
      description="Build supplier orders and receive incoming stock"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.inventory.view}>
          <PurchaseOrdersView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
