"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePlatformAbilities } from "@/hooks/use-platform-abilities";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type RequirePlatformPermissionProps = {
  permission: string | string[];
  children: React.ReactNode;
};

export function RequirePlatformPermission({
  permission,
  children,
}: RequirePlatformPermissionProps) {
  const { loading, can } = usePlatformAbilities();

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
        <h2 className="text-xl font-semibold">Platform access restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your account does not have permission for this area of the General Office dashboard.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
