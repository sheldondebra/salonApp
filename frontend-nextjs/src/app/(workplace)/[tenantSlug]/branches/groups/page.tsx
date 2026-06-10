"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { BranchGroupsView } from "@/features/branches/branch-groups-view";
import { Permissions } from "@/lib/auth/permissions";

export default function BranchGroupsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Branch groups"
      description="Organize regions and branch clusters for enterprise oversight"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.settings.manage}>
          <BranchGroupsView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
