"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-lg font-semibold">No platform access</p>
        <p className="max-w-md text-sm text-muted-foreground">
          This account is not authorized for the General Office dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
