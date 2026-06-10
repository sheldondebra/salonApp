"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { AbandonedBookingsView } from "@/features/marketing/abandoned-bookings-view";
import { Permissions } from "@/lib/auth/permissions";

export default function AbandonedBookingsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Abandoned bookings"
      description="Recover unfinished bookings with automated follow-up"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.marketing.view}>
          <AbandonedBookingsView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
