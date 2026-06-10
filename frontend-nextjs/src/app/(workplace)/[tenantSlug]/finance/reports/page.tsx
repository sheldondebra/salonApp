import { FinanceProfitLossView } from "@/features/finance/finance-profit-loss-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinanceReportsPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinanceProfitLossView tenantSlug={tenantSlug} />;
}
