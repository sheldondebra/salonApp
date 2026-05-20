"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { BranchesView } from "@/features/branches/branches-view";
import { Permissions } from "@/lib/auth/permissions";

export default function BranchesPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Branches"
      description="Manage locations for multi-branch booking"
      skeletonVariant="cards"
    >
      <RequirePermission
        tenantSlug={params.tenantSlug}
        permission={[Permissions.services.view, Permissions.settings.manage]}
      >
        <BranchesView tenantSlug={params.tenantSlug} />
      </RequirePermission>
    </WorkplacePageShell>
  );
}
