"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Branded public booking for custom tenant domains (CNAME).
 * Tenant is resolved from the Host header via GET /api/v1/booking/context.
 */
export default function CustomDomainBookingPage() {
  const { tenant, loading } = useTenant(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          {tenant?.name ?? "Book online"}
        </Link>
      </header>
      <div className="mx-auto max-w-3xl px-6 pb-16">
        {loading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <BookingWizard tenant={tenant} tenantSlug={tenant?.slug} />
        )}
      </div>
    </div>
  );
}
