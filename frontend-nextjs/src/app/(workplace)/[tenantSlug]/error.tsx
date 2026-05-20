"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function TenantWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const slug = typeof params.tenantSlug === "string" ? params.tenantSlug : "";

  return (
    <div className="mx-auto max-w-lg p-6 pt-16">
      <ErrorState
        title="Workspace error"
        description={error.message || "This page could not be loaded. Check your connection and try again."}
        onRetry={reset}
      />
      {slug ? (
        <div className="mt-4 text-center">
          <Button variant="ghost" className="rounded-xl" asChild>
            <Link href={`/${slug}/dashboard`}>Back to dashboard</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
