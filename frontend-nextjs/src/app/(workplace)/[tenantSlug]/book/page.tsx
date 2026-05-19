"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientBookingPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant, loading } = useTenant(params.tenantSlug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          Powered by SalonApp
        </Link>
        <Link href={`/${params.tenantSlug}/dashboard`} className="text-sm text-accent hover:underline">
          Business login
        </Link>
      </header>
      <div className="mx-auto max-w-3xl px-6 pb-16">
        {loading ? <Skeleton className="h-96 rounded-2xl" /> : <BookingWizard tenantSlug={params.tenantSlug} tenant={tenant} />}
      </div>
    </div>
  );
}
