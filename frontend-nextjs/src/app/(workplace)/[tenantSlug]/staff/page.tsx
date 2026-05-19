import { PortalShell } from "@/components/layout/portal-shell";

export default function StaffPortalPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <PortalShell
      badge={`Staff · ${params.tenantSlug}`}
      title="Staff workspace"
      description="Calendar, appointments, and service delivery tools for your team."
    />
  );
}
