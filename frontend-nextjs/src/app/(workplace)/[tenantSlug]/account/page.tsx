import { redirect } from "next/navigation";

export default function AccountIndexPage({ params }: { params: { tenantSlug: string } }) {
  redirect(`/${params.tenantSlug}/account/profile`);
}
