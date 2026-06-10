"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { WaitlistView } from "@/features/waitlist/waitlist-view";
import { Permissions } from "@/lib/auth/permissions";

export default function WaitlistPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="cards">
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.bookings.view}>
          <WaitlistView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
