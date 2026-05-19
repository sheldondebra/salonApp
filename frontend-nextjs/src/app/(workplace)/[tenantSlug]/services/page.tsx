"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Scissors } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { Permissions } from "@/lib/auth/permissions";

export default function ServicesPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant } = useTenant(params.tenantSlug);

  return (
    <WorkplaceShell tenantSlug={params.tenantSlug} tenantName={tenant?.name ?? params.tenantSlug}>
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.services.view}>
        <EmptyState
          icon={Scissors}
          title="Service menu"
          description="Manage categories, pricing, and durations from the API — UI editor coming soon."
        />
      </RequirePermission>
    </WorkplaceShell>
  );
}
