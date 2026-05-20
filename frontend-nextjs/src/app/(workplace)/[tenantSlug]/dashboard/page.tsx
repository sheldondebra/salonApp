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
    <WorkplacePageShell
      tenantSlug={tenantSlug}
      title="Dashboard"
      description="Your salon at a glance — bookings, revenue, and team"
      skeletonVariant="dashboard"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={tenantSlug} permission={Permissions.analytics.view}>
          <DashboardView tenantSlug={tenantSlug} currency={tenant.currency} />
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
