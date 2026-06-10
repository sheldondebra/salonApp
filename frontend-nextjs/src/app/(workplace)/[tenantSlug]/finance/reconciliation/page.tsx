import { FinanceReconciliationView } from "@/features/finance/finance-reconciliation-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinanceReconciliationPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinanceReconciliationView tenantSlug={tenantSlug} />;
}
