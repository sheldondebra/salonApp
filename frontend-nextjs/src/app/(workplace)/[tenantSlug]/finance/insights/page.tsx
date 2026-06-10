import { FinanceInsightsView } from "@/features/finance/finance-insights-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinanceInsightsPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinanceInsightsView tenantSlug={tenantSlug} />;
}
