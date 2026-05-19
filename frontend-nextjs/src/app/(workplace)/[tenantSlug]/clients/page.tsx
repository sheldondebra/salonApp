"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { Permissions } from "@/lib/auth/permissions";

export default function ClientsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant } = useTenant(params.tenantSlug);

  return (
    <WorkplaceShell tenantSlug={params.tenantSlug} tenantName={tenant?.name ?? params.tenantSlug}>
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.clients.view}>
        <EmptyState
          icon={Users}
          title="Client directory"
          description="View client profiles, booking history, and notes — connect to /clients API next."
        />
      </RequirePermission>
    </WorkplaceShell>
  );
}
