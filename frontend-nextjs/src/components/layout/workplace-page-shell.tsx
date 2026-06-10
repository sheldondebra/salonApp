"use client";

import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { PageContent } from "@/components/layout/page-layout";
import {
  ContentAreaSkeleton,
  type ContentSkeletonVariant,
} from "@/components/shared/content-area-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useTenant } from "@/hooks/use-tenant";
import type { Tenant } from "@/lib/api/types";

function displayTenantName(slug: string, name?: string | null) {
  if (name) return name;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type WorkplacePageShellProps = {
  tenantSlug: string;
  title?: string;
  description?: string;
  tagline?: string | null;
  skeletonVariant?: ContentSkeletonVariant;
  children: React.ReactNode | ((ctx: { tenant: Tenant }) => React.ReactNode);
};

/** Keeps sidebar/topbar visible while tenant context loads; skeleton only in main column. */
export function WorkplacePageShell({
  tenantSlug,
  title,
  description,
  tagline,
  skeletonVariant = "default",
  children,
}: WorkplacePageShellProps) {
  const { tenant, loading, error } = useTenant(tenantSlug);
  const tenantName = displayTenantName(tenantSlug, tenant?.name);
  const resolvedTagline = tagline ?? tenant?.branding?.tagline ?? null;

  let main: React.ReactNode;
  if (loading) {
    main = <ContentAreaSkeleton variant={skeletonVariant} />;
  } else if (error || !tenant) {
    main = (
      <ErrorState
        title="Workspace unavailable"
        description={error ?? "This salon workspace could not be loaded."}
      />
    );
  } else if (typeof children === "function") {
    main = children({ tenant });
  } else {
    main = children;
  }

  return (
    <WorkplaceShell
      tenantSlug={tenantSlug}
      tenantName={tenantName}
      tagline={resolvedTagline}
      title={title}
      description={description}
    >
      <PageContent>{main}</PageContent>
    </WorkplaceShell>
  );
}

/** Suspense / layout fallback: shell + content skeleton without fetching tenant. */
export function WorkplacePageShellPlaceholder({
  tenantSlug,
  title,
  description,
  skeletonVariant = "default",
}: {
  tenantSlug: string;
  title?: string;
  description?: string;
  skeletonVariant?: ContentSkeletonVariant;
}) {
  return (
    <WorkplaceShell
      tenantSlug={tenantSlug}
      tenantName={displayTenantName(tenantSlug)}
      title={title}
      description={description}
    >
      <PageContent>
        <ContentAreaSkeleton variant={skeletonVariant} />
      </PageContent>
    </WorkplaceShell>
  );
}
