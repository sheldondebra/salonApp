"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { AppointmentsView } from "@/features/appointments/appointments-view";
import { Permissions } from "@/lib/auth/permissions";

export default function AppointmentsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="cards">
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.bookings.view}>
          <AppointmentsView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "USD"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
