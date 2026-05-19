import { ReactNode } from "react";

export default function TenantWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenantSlug: string };
}) {
  return (
    <div data-tenant-slug={params.tenantSlug} className="min-h-screen">
      {children}
    </div>
  );
}
