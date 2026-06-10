"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { FormsListView } from "@/features/forms/forms-list-view";
import { Permissions } from "@/lib/auth/permissions";

export default function FormsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="cards">
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.forms.view}>
          <FormsListView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
