"use client";

import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import { WorkplacePageShellPlaceholder } from "@/components/layout/workplace-page-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function TenantWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenantSlug: string };
}) {
  return (
    <Suspense
      fallback={
        <WorkplacePageShellPlaceholder tenantSlug={params.tenantSlug} />
      }
    >
      <TenantWorkspaceGate tenantSlug={params.tenantSlug}>{children}</TenantWorkspaceGate>
    </Suspense>
  );
}

function TenantWorkspaceGate({
  children,
  tenantSlug,
}: {
  children: ReactNode;
  tenantSlug: string;
}) {
  const pathname = usePathname();
  const isPublicBookingRoute =
    pathname.includes("/book") && !pathname.includes("/account");

  useRequireAuth({ skip: isPublicBookingRoute });

  return (
    <div data-tenant-slug={tenantSlug} className="min-h-screen">
      {children}
    </div>
  );
}
