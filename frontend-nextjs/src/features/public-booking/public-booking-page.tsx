"use client";

import Link from "next/link";
import {
  CalendarHeart,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  Phone,
  Scissors,
} from "lucide-react";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { formatMoney } from "@/features/booking/booking-helpers";
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
  const { tenant, booking, portfolio, services, staff, loading, error } = usePublicBooking(tenantSlug);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30 p-6">
        <Skeleton className="mx-auto mb-6 h-48 max-w-4xl rounded-2xl" />
        <Skeleton className="mx-auto h-96 max-w-lg rounded-2xl" />
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
  const currency = tenant.currency ?? "USD";

  return (
    <TenantBrandStyles branding={branding}>
      <PublicBookingLayout
        tenant={tenant}
        tenantSlug={tenantSlug ?? tenant.slug}
        branding={branding}
        services={services}
        staff={staff}
        portfolio={portfolio}
        hoursLines={hoursLines}
        waLink={waLink}
        currency={currency}
        booking={booking}
        showPlatformFooter={showPlatformFooter}
      />
    </TenantBrandStyles>
  );
}

function PublicBookingLayout({
  tenant,
  tenantSlug,
  branding,
  services,
  staff,
  portfolio,
  hoursLines,
  waLink,
  currency,
  booking,
  showPlatformFooter,
}: {
  tenant: Tenant;
  tenantSlug: string;
  branding: Tenant["branding"];
  services: Service[];
  staff: StaffMember[];
  portfolio: { before_image_url: string; after_image_url: string; caption?: string | null }[];
  hoursLines: string[];
  waLink: string | null;
  currency: string;
  booking: import("@/lib/api/types").TenantBookingConfig | null;
  showPlatformFooter: boolean;
}) {
  const social = branding.social ?? {};

  return (
    <div className="bg-gradient-to-b from-brand-surface via-background to-secondary/20">
      <header className="relative overflow-hidden border-b border-border/60">
        {branding.banner_url ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.banner_url}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-accent/10" />
        )}

        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-4">
              {branding.logo_url ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:h-20 sm:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.logo_url} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/40 text-accent sm:h-20 sm:w-20">
                  <Scissors className="h-8 w-8" />
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {tenant.business_type_label ?? "Book online"}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{tenant.name}</h1>
                {branding.tagline ? (
                  <p className="mt-2 max-w-xl text-muted-foreground">{branding.tagline}</p>
                ) : null}
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0 rounded-xl shadow-soft">
              <a href="#book">
                <CalendarHeart className="mr-2 h-4 w-4" />
                Book appointment
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>

        {(social.instagram || social.facebook || social.tiktok) && (
          <section className="flex flex-wrap gap-3">
            {social.instagram ? <SocialChip href={social.instagram} label="Instagram" /> : null}
            {social.facebook ? (
              <SocialChip href={social.facebook} label="Facebook" />
            ) : null}
            {social.tiktok ? <SocialChip href={social.tiktok} label="TikTok" /> : null}
          </section>
        )}

        {branding.business_description ? (
          <section>
            <SectionHeading>About</SectionHeading>
            <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
              {branding.business_description}
            </p>
          </section>
        ) : null}

        {services.length > 0 ? (
          <section>
            <SectionHeading>Services</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.slice(0, 8).map((s) => (
                <Card key={s.id} className="rounded-2xl border-border/60 shadow-soft">
                  <CardContent className="p-4">
                    <p className="font-medium">{s.name}</p>
                    {s.category?.name ? (
                      <p className="text-xs text-muted-foreground">{s.category.name}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatMoney(s.price_cents, currency)} · {s.duration_minutes} min
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {services.length > 8 ? (
              <p className="mt-2 text-sm text-muted-foreground">+{services.length - 8} more when you book</p>
            ) : null}
          </section>
        ) : null}

        {staff.length > 0 ? (
          <section>
            <SectionHeading>Our team</SectionHeading>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {staff.map((member) => (
                <Card
                  key={member.id}
                  className="min-w-[140px] shrink-0 rounded-2xl border-border/60 shadow-soft"
                >
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/30 text-sm font-semibold text-accent">
                      {member.display_name.charAt(0)}
                    </div>
                    <p className="font-medium">{member.display_name}</p>
                    {member.title ? (
                      <p className="text-xs text-muted-foreground">{member.title}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.length > 0 ? (
          <section>
            <SectionHeading>Portfolio</SectionHeading>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {portfolio.slice(0, 4).map((item, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
                  <div className="grid grid-cols-2 gap-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.before_image_url} alt="Before" className="aspect-square object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.after_image_url} alt="After" className="aspect-square object-cover" />
                  </div>
                  {item.caption ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{item.caption}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="book" className="scroll-mt-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <SectionHeading>Book your visit</SectionHeading>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Pick services, choose a time, and confirm in a few steps.
            </p>
            <ChevronDown className="mt-3 h-5 w-5 animate-bounce text-muted-foreground" />
          </div>
          <BookingWizard tenantSlug={tenantSlug} tenant={tenant} booking={booking} />
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        {showPlatformFooter ? (
          <Link href="/" className="inline-flex items-center gap-2 hover:text-foreground">
            <Scissors className="h-4 w-4 text-accent" />
            Powered by SalonApp
          </Link>
        ) : (
          <span>{tenant.name}</span>
        )}
        {tenantSlug ? (
          <p className="mt-2 text-xs">
            <Link href={`/${tenantSlug}/dashboard`} className="text-accent hover:underline">
              Business login
            </Link>
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight">{children}</h2>;
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
    <Card className={cn("rounded-2xl border-border/60 shadow-soft", className)}>
      <CardContent className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
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
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-accent/40 hover:bg-primary/10"
    >
      {label}
    </a>
  );
}
