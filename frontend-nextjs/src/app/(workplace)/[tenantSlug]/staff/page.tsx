"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { StaffTeamView } from "@/features/staff/staff-team-view";
import { Permissions } from "@/lib/auth/permissions";

export default function StaffPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Team"
      description="Staff profiles, schedules, and roles"
      skeletonVariant="table"
    >
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.staff.view}>
        <StaffTeamView tenantSlug={params.tenantSlug} />
      </RequirePermission>
    </WorkplacePageShell>
  );
}
