"use client";

import { Suspense } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useTenant } from "@/hooks/use-tenant";
import { Permissions } from "@/lib/auth/permissions";

function TenantDashboardContent({ tenantSlug }: { tenantSlug: string }) {
  useRequireAuth();
  const { tenant, loading } = useTenant(tenantSlug);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  return (
    <WorkplaceShell
      tenantSlug={tenantSlug}
      tenantName={tenant?.name ?? tenantSlug}
      tagline={tenant?.branding?.tagline}
    >
      <RequirePermission tenantSlug={tenantSlug} permission={Permissions.analytics.view}>
        <DashboardView tenantSlug={tenantSlug} currency={tenant?.currency} />
      </RequirePermission>
    </WorkplaceShell>
  );
}

export default function TenantDashboardPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-10 w-48" /></div>}>
      <TenantDashboardContent tenantSlug={params.tenantSlug} />
    </Suspense>
  );
}
