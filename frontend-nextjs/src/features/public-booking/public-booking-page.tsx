"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarHeart,
  Clock,
  Mail,
  MapPin,
  Phone,
  Scissors,
} from "lucide-react";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { PublicServicesSection } from "@/features/public-booking/public-services-section";
import { TenantBrandStyles } from "@/components/branding/tenant-brand-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicBooking } from "@/hooks/use-public-booking";
import { defaultOpeningHours, formatHoursForDisplay } from "@/lib/branding/opening-hours";
import type { Service, StaffMember, Tenant } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type PublicBookingPageProps = {
  tenantSlug?: string | null;
  showPlatformFooter?: boolean;
};

function whatsappHref(number: string | null | undefined): string | null {
  if (!number?.trim()) return null;
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function PublicBookingPage({ tenantSlug, showPlatformFooter = true }: PublicBookingPageProps) {
  const { tenant, booking, portfolio, locations, services, staff, loading, error } =
    usePublicBooking(tenantSlug);

  const catalog = useMemo(
    () => (loading ? null : { locations, services, staff }),
    [loading, locations, services, staff]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="mx-auto grid max-w-6xl gap-8 p-4 sm:p-6 lg:grid-cols-[1fr,minmax(0,28rem)]">
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-[28rem] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold">Booking page unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Workspace not found"}</p>
        </div>
      </div>
    );
  }

  const branding = tenant.branding;
  const hoursLines = formatHoursForDisplay(
    branding.opening_hours?.length ? branding.opening_hours : defaultOpeningHours()
  );
  const waLink = whatsappHref(branding.whatsapp);
  const resolvedSlug = tenantSlug ?? tenant.slug;

  return (
    <TenantBrandStyles branding={branding}>
      <PublicBookingLayout
        tenant={tenant}
        tenantSlug={resolvedSlug}
        branding={branding}
        staff={staff}
        portfolio={portfolio}
        hoursLines={hoursLines}
        waLink={waLink}
        booking={booking}
        catalog={catalog}
        services={services}
        showPlatformFooter={showPlatformFooter}
        serviceCount={services.length}
      />
    </TenantBrandStyles>
  );
}

function PublicBookingLayout({
  tenant,
  tenantSlug,
  branding,
  staff,
  portfolio,
  hoursLines,
  waLink,
  booking,
  catalog,
  services,
  showPlatformFooter,
  serviceCount,
}: {
  tenant: Tenant;
  tenantSlug: string;
  branding: Tenant["branding"];
  staff: StaffMember[];
  portfolio: { before_image_url: string; after_image_url: string; caption?: string | null }[];
  hoursLines: string[];
  waLink: string | null;
  booking: import("@/lib/api/types").TenantBookingConfig | null;
  catalog: { locations: import("@/lib/api/types").Location[]; services: Service[]; staff: StaffMember[] } | null;
  services: Service[];
  showPlatformFooter: boolean;
  serviceCount: number;
}) {
  const social = branding.social ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20 pb-20 lg:pb-0">
      <header className="relative overflow-hidden border-b border-border/60">
        {branding.banner_url ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.banner_url}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        )}

        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-10">
          <div className="flex gap-4">
            {branding.logo_url ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:h-16 sm:w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logo_url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/40 text-accent sm:h-16 sm:w-16">
                <Scissors className="h-7 w-7" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {tenant.business_type_label ?? "Book online"}
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{tenant.name}</h1>
              {branding.tagline ? (
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">{branding.tagline}</p>
              ) : null}
              {serviceCount > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {serviceCount} service{serviceCount === 1 ? "" : "s"} available to book
                </p>
              ) : null}
            </div>
          </div>
          <Button asChild size="lg" className="w-full shrink-0 rounded-xl shadow-soft sm:w-auto">
            <a href="#book">
              <CalendarHeart className="mr-2 h-4 w-4" />
              Book now
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-10 lg:py-10">
        {/* Booking wizard — first on mobile, full width on desktop */}
        <section
          id="book"
          className="order-1 scroll-mt-20 lg:order-2 lg:col-span-1"
          aria-label="Book an appointment"
        >
          <div className="mb-4 lg:hidden">
            <h2 className="text-lg font-semibold tracking-tight">Book your visit</h2>
            <p className="text-sm text-muted-foreground">
              Select services, pick a time, and confirm in minutes.
            </p>
          </div>
          <BookingWizard
            tenantSlug={tenantSlug}
            tenant={tenant}
            booking={booking}
            catalog={catalog}
            className="lg:shadow-lg"
          />
        </section>

        {/* Salon info */}
        <div className="order-2 space-y-8 lg:order-1">
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold tracking-tight">About {tenant.name}</h2>
            {branding.business_description ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {branding.business_description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Book your appointment online — choose your services and preferred time below.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <InfoCard title="Contact" icon={Phone}>
              <ContactLine icon={Phone} href={branding.business_phone ? `tel:${branding.business_phone}` : undefined}>
                {branding.business_phone ?? "—"}
              </ContactLine>
              <ContactLine icon={Mail} href={branding.business_email ? `mailto:${branding.business_email}` : undefined}>
                {branding.business_email ?? "—"}
              </ContactLine>
              {waLink ? (
                <ContactLine icon={Phone} href={waLink}>
                  WhatsApp
                </ContactLine>
              ) : null}
            </InfoCard>

            <InfoCard title="Visit us" icon={MapPin}>
              <p className="text-sm text-muted-foreground">{branding.address ?? "Address on file"}</p>
              {branding.website_url ? (
                <a
                  href={branding.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Visit website
                </a>
              ) : null}
            </InfoCard>

            <InfoCard title="Hours" icon={Clock} className="sm:col-span-2 lg:col-span-1">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {hoursLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </InfoCard>
          </div>

          {(social.instagram || social.facebook || social.tiktok || social.twitter) && (
            <div className="flex flex-wrap gap-2">
              {social.instagram ? <SocialChip href={social.instagram} label="Instagram" /> : null}
              {social.facebook ? <SocialChip href={social.facebook} label="Facebook" /> : null}
              {social.tiktok ? <SocialChip href={social.tiktok} label="TikTok" /> : null}
              {social.twitter ? <SocialChip href={social.twitter} label="X" /> : null}
            </div>
          )}

          <PublicServicesSection
            services={services}
            currency={tenant.currency ?? booking?.currency ?? "USD"}
          />

          {branding.business_description ? (
            <section className="lg:hidden">
              <h3 className="text-base font-semibold">About</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {branding.business_description}
              </p>
            </section>
          ) : null}

          {staff.length > 0 ? (
            <section>
              <h3 className="text-base font-semibold">Our team</h3>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {staff.map((member) => (
                  <Card
                    key={member.id}
                    className="min-w-[120px] shrink-0 rounded-xl border-border/60 shadow-soft"
                  >
                    <CardContent className="p-3 text-center">
                      <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-sm font-semibold text-accent">
                        {member.display_name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium">{member.display_name}</p>
                      {member.title ? (
                        <p className="text-[11px] text-muted-foreground">{member.title}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {portfolio.length > 0 ? (
            <section>
              <h3 className="text-base font-semibold">Portfolio</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {portfolio.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"
                  >
                    <div className="grid grid-cols-2 gap-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.before_image_url} alt="Before" className="aspect-square object-cover" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.after_image_url} alt="After" className="aspect-square object-cover" />
                    </div>
                    {item.caption ? (
                      <p className="px-2 py-1.5 text-[11px] text-muted-foreground">{item.caption}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <Button asChild className="h-11 w-full rounded-xl shadow-soft">
          <a href="#book">
            <CalendarHeart className="mr-2 h-4 w-4" />
            Book your appointment
          </a>
        </Button>
      </div>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        {showPlatformFooter ? (
          <Link href="/" className="inline-flex items-center gap-2 hover:text-foreground">
            <Scissors className="h-4 w-4 text-accent" />
            Powered by SalonApp
          </Link>
        ) : (
          <span>{tenant.name}</span>
        )}
        <p className="mt-2 text-xs">
          <Link href={`/${tenantSlug}/dashboard`} className="text-accent hover:underline">
            Business login
          </Link>
        </p>
      </footer>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Phone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-xl border-border/60 shadow-soft", className)}>
      <CardContent className="p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-accent" />
          {title}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

function ContactLine({
  icon: Icon,
  href,
  children,
}: {
  icon: typeof Phone;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
      {children}
    </span>
  );
  if (href) {
    return (
      <a href={href} className="mt-1 block hover:text-foreground">
        {content}
      </a>
    );
  }
  return <div className="mt-1">{content}</div>;
}

function SocialChip({ href, label }: { href: string; label: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-accent/40 hover:bg-primary/10"
    >
      {label}
    </a>
  );
}
