import { redirect } from "next/navigation";

export default function FinanceIndexPage({ params }: { params: { tenantSlug: string } }) {
  redirect(`/${params.tenantSlug}/finance/overview`);
}
