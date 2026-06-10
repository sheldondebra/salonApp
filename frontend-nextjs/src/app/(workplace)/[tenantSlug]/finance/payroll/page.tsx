import { FinancePayrollView } from "@/features/finance/finance-payroll-view";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function FinancePayrollPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <FinancePayrollView tenantSlug={tenantSlug} />;
}
