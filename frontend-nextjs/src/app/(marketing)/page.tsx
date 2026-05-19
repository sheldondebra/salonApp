import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";

export default function MarketingPage() {
  return (
    <PortalShell
      badge="Beauty Booking SaaS"
      title="Run your salon like a luxury brand."
      description="SalonApp foundation is ready — multi-tenant workspaces, staff & client portals, and API-first architecture for web and mobile."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm"
        >
          Super Admin
        </Link>
        <Link
          href="/demo-salon/dashboard"
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium"
        >
          Tenant Dashboard (demo)
        </Link>
      </div>
    </PortalShell>
  );
}
