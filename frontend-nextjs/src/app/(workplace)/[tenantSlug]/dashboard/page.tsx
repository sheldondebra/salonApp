"use client";

import { Suspense } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import {
  WorkplacePageShell,
  WorkplacePageShellPlaceholder,
} from "@/components/layout/workplace-page-shell";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { Permissions } from "@/lib/auth/permissions";

function TenantDashboardContent({ tenantSlug }: { tenantSlug: string }) {
  return (
    <WorkplacePageShell tenantSlug={tenantSlug} skeletonVariant="dashboard">
      {({ tenant }) => (
        <RequirePermission tenantSlug={tenantSlug} permission={Permissions.analytics.view}>
          <DashboardView
            tenantSlug={tenantSlug}
            tenantName={tenant.name}
            currency={tenant.currency}
          />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}

export default function TenantDashboardPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <Suspense
      fallback={
        <WorkplacePageShellPlaceholder tenantSlug={params.tenantSlug} skeletonVariant="dashboard" />
      }
    >
      <TenantDashboardContent tenantSlug={params.tenantSlug} />
    </Suspense>
  );
}
