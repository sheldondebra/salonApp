"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlatformAccessDenied } from "@/components/admin/platform-access-denied";
import { AdminShell } from "@/components/layout/admin-shell";
import { ContentAreaSkeleton } from "@/components/shared/content-area-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePlatformAbilities } from "@/hooks/use-platform-abilities";
import { Permissions } from "@/lib/auth/permissions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <AdminShell title="General Office" description="Loading…">
          <ContentAreaSkeleton variant="dashboard" />
        </AdminShell>
      }
    >
      <AdminLayoutGate>{children}</AdminLayoutGate>
    </Suspense>
  );
}

function AdminLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { loading, can, error, sessionExpired, reload } = usePlatformAbilities();

  useEffect(() => {
    if (!ready || loading) return;
    if (sessionExpired) {
      router.replace("/login?next=/admin");
    }
  }, [ready, loading, sessionExpired, router]);

  if (!ready || loading) {
    return (
      <AdminShell title="General Office" description="Loading…">
        <ContentAreaSkeleton variant="dashboard" />
      </AdminShell>
    );
  }

  if (sessionExpired) {
    return (
      <AdminShell title="General Office" description="Session expired">
        <ContentAreaSkeleton variant="dashboard" />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="General Office" description="Could not verify access">
        <ErrorState description={error} onRetry={reload} />
      </AdminShell>
    );
  }

  if (!can(Permissions.tenants.view) && !can(Permissions.billing.manage)) {
    return <PlatformAccessDenied />;
  }

  return <>{children}</>;
}
