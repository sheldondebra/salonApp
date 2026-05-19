"use client";

import { ShieldAlert } from "lucide-react";
import { useAbilities } from "@/hooks/use-abilities";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type RequirePermissionProps = {
  tenantSlug: string;
  permission: string | string[];
  children: React.ReactNode;
};

export function RequirePermission({ tenantSlug, permission, children }: RequirePermissionProps) {
  const { loading, can } = useAbilities(tenantSlug);

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your role does not have permission to view this page. Contact your workspace owner if
          you need access.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={`/${tenantSlug}/dashboard`}>Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
