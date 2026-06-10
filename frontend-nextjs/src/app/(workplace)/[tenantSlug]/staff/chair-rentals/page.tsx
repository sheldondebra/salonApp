"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ChairRentalsView } from "@/features/staff/chair-rentals-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ChairRentalsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Chair rentals"
      description="Manage self-employed chair and booth rental agreements"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.staff.settings}>
          <ChairRentalsView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
