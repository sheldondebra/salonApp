import { redirect } from "next/navigation";

/**
 * Workplace tenant root — send visitors to public booking instead of a 404.
 */
export default function TenantRootPage({ params }: { params: { tenantSlug: string } }) {
  redirect(`/${params.tenantSlug}/book`);
}
