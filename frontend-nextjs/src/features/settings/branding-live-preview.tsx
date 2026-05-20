"use client";

import { Scissors } from "lucide-react";
import { TenantBrandStyles } from "@/components/branding/tenant-brand-styles";
import type { TenantBranding } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type BrandingLivePreviewProps = {
  tenantName: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  className?: string;
};

export function BrandingLivePreview({
  tenantName,
  tagline,
  logoUrl,
  bannerUrl,
  primaryColor,
  accentColor,
  className,
}: BrandingLivePreviewProps) {
  const branding: TenantBranding = {
    logo_url: logoUrl || null,
    banner_url: bannerUrl || null,
    primary_color: primaryColor,
    accent_color: accentColor,
    tagline: tagline || null,
    business_description: null,
    business_phone: null,
    business_email: null,
    whatsapp: null,
    address: null,
    website_url: null,
  };

  return (
    <TenantBrandStyles branding={branding}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
          className
        )}
      >
        <div className="relative h-20 bg-gradient-to-br from-primary/30 to-accent/20">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
        </div>
        <div className="relative px-4 pb-4">
          <div className="-mt-6 flex items-end gap-3">
            {logoUrl ? (
              <div className="h-12 w-12 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/40 text-accent">
                <Scissors className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 pb-0.5">
              <p className="truncate text-sm font-semibold">{tenantName || "Your salon"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tagline || "Tagline appears here"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="h-7 flex-1 rounded-lg bg-primary/40" />
            <span className="h-7 w-16 rounded-lg bg-accent/50" />
          </div>
        </div>
      </div>
    </TenantBrandStyles>
  );
}
