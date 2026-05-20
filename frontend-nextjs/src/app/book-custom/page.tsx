import { PublicBookingPage } from "@/features/public-booking/public-booking-page";

/**
 * Branded public booking for custom tenant domains (CNAME).
 * Tenant is resolved from the Host header via GET /api/v1/booking/context.
 */
export default function CustomDomainBookingPage() {
  return <PublicBookingPage showPlatformFooter={false} />;
}
