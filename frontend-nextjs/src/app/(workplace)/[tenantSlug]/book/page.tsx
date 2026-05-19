import { PortalShell } from "@/components/layout/portal-shell";

export default function ClientBookingPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <PortalShell
      badge={`Client · ${params.tenantSlug}`}
      title="Book your appointment"
      description="Fresha-style booking flow with searchable service & staff selectors will mount here."
    />
  );
}
