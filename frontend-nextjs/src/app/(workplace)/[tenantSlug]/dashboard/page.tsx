import { PortalShell } from "@/components/layout/portal-shell";

export default function TenantDashboardPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <PortalShell
      badge={`Tenant · ${params.tenantSlug}`}
      title="Business dashboard"
      description="Stripe-style analytics, bookings, and team management will live here."
    />
  );
}
