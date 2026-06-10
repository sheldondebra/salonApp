"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  Link2,
  Palette,
  ListChecks,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { SplitPageLayout } from "@/components/layout/page-layout";
import { SectionSidebar } from "@/components/shared/section-sidebar";
import { BookingPageUrlsCard } from "@/features/settings/booking-page-urls-card";
import { BrandingSettingsForm } from "@/features/settings/branding-settings-form";
import { NotificationSettingsForm } from "@/features/settings/notification-settings-form";
import { PaymentSettingsForm } from "@/features/settings/payment-settings-form";
import { TenantMtnMomoConnection } from "@/features/settings/tenant-mtn-momo-connection";
import { TenantPaymentModeSettings } from "@/features/settings/tenant-payment-mode-settings";
import { SettingsNav, type SettingsNavItem } from "@/features/settings/settings-ui";
import { TenantCouponsSection } from "@/features/settings/tenant-coupons-section";
import type { OnboardingProgress } from "@/features/onboarding/types";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Tenant } from "@/lib/api/types";

const NAV_ITEMS: SettingsNavItem[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "booking", label: "Booking", icon: Link2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "SMS", icon: Bell },
  { id: "coupons", label: "Coupons", icon: Tag },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SettingsContent({ tenantSlug, tenant: initialTenant }: { tenantSlug: string; tenant: Tenant }) {
  const [tenant, setTenant] = useState(initialTenant);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
  const [businessTypeLabel, setBusinessTypeLabel] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    setTenant(initialTenant);
  }, [initialTenant]);

  const handleTenantUpdated = useCallback((updated: Tenant) => {
    setTenant(updated);
  }, []);

  useEffect(() => {
    let cancelled = false;
    createApiClient(getApiClientOptions())
      .get<{
        onboarding: OnboardingProgress;
        settings: { business_type_label?: string | null };
      }>(`/${tenantSlug}/settings`)
      .then((res) => {
        if (cancelled) return;
        setOnboarding(res.onboarding);
        setBusinessTypeLabel(
          res.settings?.business_type_label ?? initialTenant.business_type_label ?? null
        );
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message ? err.message : "Could not load settings";
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, initialTenant.business_type_label]);

  useEffect(() => {
    const sections = NAV_ITEMS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [businessTypeLabel, onboarding]);

  function handleNav(id: string) {
    setActiveSection(id);
    scrollToSection(id);
  }

  return (
    <RequirePermission tenantSlug={tenantSlug} permission={Permissions.settings.manage}>
      <SplitPageLayout
        sidebar={
          <SectionSidebar
            title="Settings"
            subtitle="Workspace configuration"
            items={NAV_ITEMS.map(({ id, label, icon }) => ({ id, label, icon }))}
            selectedId={activeSection}
            onSelect={handleNav}
            className="hidden lg:flex"
          />
        }
      >
        <div className="w-full space-y-6">
          <div className="lg:hidden">
            <SettingsNav items={NAV_ITEMS} activeId={activeSection} onSelect={handleNav} />
          </div>

        <section id="general" className="scroll-mt-24 space-y-6">
          {businessTypeLabel ? (
            <Card className="rounded-2xl shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Business type</CardTitle>
                    <CardDescription>Your workspace category</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{businessTypeLabel}</p>
              </CardContent>
            </Card>
          ) : null}

          {onboarding ? (
            <Card className="rounded-2xl shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                    <ListChecks className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Setup progress</CardTitle>
                    <CardDescription>
                      {onboarding.completed_count} of {onboarding.total} steps completed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={onboarding.percent} className="h-2" />
                <p className="text-right text-xs tabular-nums text-muted-foreground">
                  {onboarding.percent}%
                </p>
              </CardContent>
            </Card>
          ) : null}
        </section>

        <section id="booking" className="scroll-mt-24">
          <BookingPageUrlsCard tenantSlug={tenantSlug} domains={tenant.domains} />
        </section>

        <section id="branding" className="scroll-mt-24">
          <BrandingSettingsForm
            tenantSlug={tenantSlug}
            tenant={tenant}
            onTenantUpdated={handleTenantUpdated}
          />
        </section>

        <section id="payments" className="scroll-mt-24 space-y-6">
          <TenantPaymentModeSettings tenantSlug={tenantSlug} />
          <TenantMtnMomoConnection tenantSlug={tenantSlug} />
          <PaymentSettingsForm tenantSlug={tenantSlug} />
        </section>

        <section id="notifications" className="scroll-mt-24">
          <NotificationSettingsForm tenantSlug={tenantSlug} />
        </section>

        <section id="coupons" className="scroll-mt-24">
          <TenantCouponsSection tenantSlug={tenantSlug} currency={tenant.currency ?? "GHS"} />
        </section>
        </div>
      </SplitPageLayout>
    </RequirePermission>
  );
}

export default function SettingsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Settings"
      description="Branding, payments, notifications, and your public booking page"
      skeletonVariant="form"
    >
      {({ tenant }) => <SettingsContent tenantSlug={params.tenantSlug} tenant={tenant} />}
    </WorkplacePageShell>
  );
}
