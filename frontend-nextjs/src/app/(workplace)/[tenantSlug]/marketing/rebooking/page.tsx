"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { RebookingView } from "@/features/marketing/rebooking-view";
import { Permissions } from "@/lib/auth/permissions";

export default function RebookingPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Rebooking"
      description="Bring clients back based on lapse windows and visit history"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.marketing.view}>
          <RebookingView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
