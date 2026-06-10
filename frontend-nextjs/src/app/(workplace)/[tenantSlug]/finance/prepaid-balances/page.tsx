import { FinancePrepaidBalancesView } from "@/features/finance/finance-prepaid-balances-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinancePrepaidBalancesPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinancePrepaidBalancesView tenantSlug={tenantSlug} />;
}
