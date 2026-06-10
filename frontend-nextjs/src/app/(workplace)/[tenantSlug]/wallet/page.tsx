"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { WalletView } from "@/features/wallet/wallet-view";
import { Permissions } from "@/lib/auth/permissions";

export default function WalletPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Wallet"
      description="Your balance, pending collections, and transaction history"
      skeletonVariant="table"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.wallet.view}>
          <WalletView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
