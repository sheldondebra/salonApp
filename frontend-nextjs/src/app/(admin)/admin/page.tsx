import { PortalShell } from "@/components/layout/portal-shell";

export const metadata = { title: "Super Admin" };

export default function SuperAdminPage() {
  return (
    <PortalShell
      badge="Super Admin Portal"
      title="Platform control center"
      description="Manage tenants, plans, billing, and platform analytics. Feature modules will mount here."
    />
  );
}
