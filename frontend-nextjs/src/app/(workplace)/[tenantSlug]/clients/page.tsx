"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ClientsView } from "@/features/clients/clients-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ClientsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Clients"
      description="Customer profiles and booking history"
      skeletonVariant="table"
    >
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.clients.view}>
        <ClientsView tenantSlug={params.tenantSlug} />
      </RequirePermission>
    </WorkplacePageShell>
  );
}
