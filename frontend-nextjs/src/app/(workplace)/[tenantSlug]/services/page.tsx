"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ServicesManageView } from "@/features/services/services-manage-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ServicesPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Services"
      description="Menu, categories, and portfolio gallery"
      skeletonVariant="table"
    >
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.services.view}>
        <ServicesManageView tenantSlug={params.tenantSlug} />
      </RequirePermission>
    </WorkplacePageShell>
  );
}
