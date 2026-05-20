"use client";

import { PublicBookingPage } from "@/features/public-booking/public-booking-page";

/**
 * Branded public booking for custom tenant domains (CNAME).
 * Tenant is resolved from the Host header via GET /api/v1/booking/context.
 */
export default function CustomDomainBookingPage() {
  const demoSlug = process.env.NEXT_PUBLIC_DEMO_TENANT_SLUG?.trim() || undefined;

  return <PublicBookingPage tenantSlug={demoSlug} showPlatformFooter={false} />;
}
