import { FinanceTaxesView } from "@/features/finance/finance-taxes-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinanceTaxesPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinanceTaxesView tenantSlug={tenantSlug} />;
}
