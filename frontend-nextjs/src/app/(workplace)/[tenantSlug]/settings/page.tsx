"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { BookingPageUrlsCard } from "@/features/settings/booking-page-urls-card";
import { BrandingSettingsForm } from "@/features/settings/branding-settings-form";
import { NotificationSettingsForm } from "@/features/settings/notification-settings-form";
import { PaymentSettingsForm } from "@/features/settings/payment-settings-form";
import { TenantCouponsSection } from "@/features/settings/tenant-coupons-section";
import type { OnboardingProgress } from "@/features/onboarding/types";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Tenant } from "@/lib/api/types";

function SettingsContent({ tenantSlug, tenant: initialTenant }: { tenantSlug: string; tenant: Tenant }) {
  const [tenant, setTenant] = useState(initialTenant);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
  const [businessTypeLabel, setBusinessTypeLabel] = useState<string | null>(null);

  useEffect(() => {
    setTenant(initialTenant);
  }, [initialTenant]);

  const handleTenantUpdated = useCallback((updated: Tenant) => {
    setTenant(updated);
  }, []);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{
        onboarding: OnboardingProgress;
        settings: { business_type_label?: string | null };
      }>(`/${tenantSlug}/settings`)
      .then((res) => {
        setOnboarding(res.onboarding);
        setBusinessTypeLabel(
          res.settings?.business_type_label ?? tenant.business_type_label ?? null
        );
      })
      .catch(() => toast.error("Could not load settings"));
  }, [tenant, tenantSlug]);

  return (
    <RequirePermission tenantSlug={tenantSlug} permission={Permissions.settings.manage}>
      <div className="space-y-6">
        {businessTypeLabel ? (
          <Card className="max-w-3xl shadow-soft">
            <CardHeader>
              <CardTitle>Business type</CardTitle>
              <CardDescription>Your workspace category</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{businessTypeLabel}</p>
            </CardContent>
          </Card>
        ) : null}

        {onboarding ? (
          <Card className="max-w-3xl shadow-soft">
            <CardHeader>
              <CardTitle>Setup progress</CardTitle>
              <CardDescription>
                {onboarding.completed_count} of {onboarding.total} steps completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={onboarding.percent} />
            </CardContent>
          </Card>
        ) : null}

        <BookingPageUrlsCard tenantSlug={tenantSlug} domains={tenant.domains} />
        <BrandingSettingsForm
          tenantSlug={tenantSlug}
          tenant={tenant}
          onTenantUpdated={handleTenantUpdated}
        />
        <PaymentSettingsForm tenantSlug={tenantSlug} />
        <NotificationSettingsForm tenantSlug={tenantSlug} />
        <TenantCouponsSection tenantSlug={tenantSlug} currency={tenant.currency ?? "GHS"} />
      </div>
    </RequirePermission>
  );
}

export default function SettingsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Settings"
      description="Branding and public booking page"
      skeletonVariant="form"
    >
      {({ tenant }) => <SettingsContent tenantSlug={params.tenantSlug} tenant={tenant} />}
    </WorkplacePageShell>
  );
}
