"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { ContentAreaSkeleton } from "@/components/shared/content-area-skeleton";
import { useTenant } from "@/hooks/use-tenant";
import { getAuthToken } from "@/lib/auth/session";

export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const router = useRouter();
  const { tenant, loading } = useTenant(params.tenantSlug);
  const displayName =
    tenant?.name ??
    params.tenantSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace(`/login?next=/${params.tenantSlug}/account/profile`);
    }
  }, [params.tenantSlug, router]);

  return (
    <AccountShell tenantSlug={params.tenantSlug} tenantName={displayName}>
      {loading ? <ContentAreaSkeleton variant="form" /> : children}
    </AccountShell>
  );
}
