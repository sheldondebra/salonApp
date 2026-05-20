"use client";

import { PublicBookingPage } from "@/features/public-booking/public-booking-page";

export default function ClientBookingPage({ params }: { params: { tenantSlug: string } }) {
  return <PublicBookingPage tenantSlug={params.tenantSlug} showPlatformFooter />;
}
