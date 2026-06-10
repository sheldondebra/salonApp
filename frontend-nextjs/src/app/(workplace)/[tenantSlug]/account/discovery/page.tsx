"use client";

import { AccountDiscoveryView } from "@/features/account/account-discovery-view";

export default function AccountDiscoveryPage({ params }: { params: { tenantSlug: string } }) {
  return <AccountDiscoveryView tenantSlug={params.tenantSlug} />;
}
