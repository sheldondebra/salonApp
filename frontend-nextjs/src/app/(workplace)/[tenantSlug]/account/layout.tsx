"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { useTenant } from "@/hooks/use-tenant";
import { getAuthToken } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const router = useRouter();
  const { tenant, loading } = useTenant(params.tenantSlug);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace(`/login?next=/${params.tenantSlug}/account/profile`);
    }
  }, [params.tenantSlug, router]);

  if (loading) {
    return <Skeleton className="m-10 h-96 rounded-2xl" />;
  }

  return (
    <AccountShell tenantSlug={params.tenantSlug} tenantName={tenant?.name ?? params.tenantSlug}>
      {children}
    </AccountShell>
  );
}
