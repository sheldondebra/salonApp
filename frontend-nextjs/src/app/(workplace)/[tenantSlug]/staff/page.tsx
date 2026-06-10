"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { StaffTeamView } from "@/features/staff/staff-team-view";
import { Permissions } from "@/lib/auth/permissions";

export default function StaffPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="table">
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.staff.view}>
          <StaffTeamView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
