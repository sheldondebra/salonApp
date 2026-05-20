"use client";

import type { TenantBranding } from "@/lib/api/types";
import { hexToHslChannels } from "@/lib/branding/hex-to-hsl";

type TenantBrandStylesProps = {
  branding: TenantBranding | null | undefined;
  children: React.ReactNode;
};

export function TenantBrandStyles({ branding, children }: TenantBrandStylesProps) {
  const primary = hexToHslChannels(branding?.primary_color ?? "#F8BBD0");
  const accent = hexToHslChannels(branding?.accent_color ?? "#E879A6");

  const style = {
    ...(primary
      ? {
          "--primary": primary,
          "--ring": accent ?? primary,
          "--sidebar-primary": primary,
        }
      : {}),
    ...(accent
      ? {
          "--accent": accent,
          "--sidebar-ring": accent,
        }
      : {}),
  } as React.CSSProperties;

  return (
    <div style={style} className="tenant-branded min-h-screen">
      {children}
    </div>
  );
}
