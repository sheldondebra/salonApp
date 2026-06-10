"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarHeart,
  Clock,
  Mail,
  MapPin,
  Phone,
  Scissors,
} from "lucide-react";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { PublicServicesSection } from "@/features/public-booking/public-services-section";
import { PublicReviewsSection } from "@/features/public-booking/public-reviews-section";
import { StoreProductsSection } from "@/features/store/store-products-section";
import { TenantBrandStyles } from "@/components/branding/tenant-brand-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicBooking } from "@/hooks/use-public-booking";
import { defaultOpeningHours, formatHoursForDisplay } from "@/lib/branding/opening-hours";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Review, Service, StaffMember, StoreProduct, Tenant } from "@/lib/api/types";
import { FloatingWhatsAppButton } from "@/components/shared/floating-whatsapp-button";
import { bookingPrimaryButtonClass, bookingPrimaryLinkClass } from "@/features/booking/booking-ui";
import {
  buildWhatsAppChatUrl,
  defaultBookingWhatsAppMessage,
} from "@/lib/branding/whatsapp";
import { cn } from "@/lib/utils";

const PAGE_PAD = "px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20";
const PAGE_WIDTH = "mx-auto w-full max-w-[1600px]";

type PublicBookingPageProps = {
  tenantSlug?: string | null;
  showPlatformFooter?: boolean;
};

export function PublicBookingPage({ tenantSlug, showPlatformFooter = true }: PublicBookingPageProps) {
  const { tenant, booking, portfolio, locations, services, staff, loading, error } =
    usePublicBooking(tenantSlug);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);

  const catalog = useMemo(
    () => (loading ? null : { locations, services, staff }),
    [loading, locations, services, staff]
  );

  const resolvedSlug = tenantSlug ?? tenant?.slug;

  useEffect(() => {
    if (!resolvedSlug) return;
    let cancelled = false;
    const client = createApiClient(getApiClientOptions(undefined, resolvedSlug));
    Promise.all([
      client.get<{ data: Review[] }>(`/${resolvedSlug}/reviews?public=1&per_page=8`).catch(() => ({ data: [] })),
      client.get<{ data: StoreProduct[] }>(`/${resolvedSlug}/store/products`).catch(() => ({ data: [] })),
    ]).then(([reviewsRes, storeRes]) => {
      if (cancelled) return;
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      setStoreProducts(Array.isArray(storeRes.data) ? storeRes.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className={cn(PAGE_WIDTH, PAGE_PAD, "space-y-8 py-12")}>
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-[32rem] w-full rounded-2xl" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
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
  const waMessage = defaultBookingWhatsAppMessage(tenant.name);
  const waLink = buildWhatsAppChatUrl(branding.whatsapp, waMessage);
  const bookingSlug = tenantSlug ?? tenant.slug;

  return (
    <TenantBrandStyles branding={branding}>
      <PublicBookingLayout
        tenant={tenant}
        tenantSlug={bookingSlug}
        branding={branding}
        staff={staff}
        portfolio={portfolio}
        hoursLines={hoursLines}
        waLink={waLink}
        booking={booking}
        catalog={catalog}
        services={services}
        reviews={reviews}
        storeProducts={storeProducts}
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
  reviews,
  storeProducts,
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
  reviews: Review[];
  storeProducts: StoreProduct[];
  showPlatformFooter: boolean;
  serviceCount: number;
}) {
  const social = branding.social ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20">
      <header className="relative overflow-hidden border-b border-border/50">
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        )}

        <div
          className={cn(
            PAGE_WIDTH,
            PAGE_PAD,
            "relative flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14 lg:py-16"
          )}
        >
          <div className="flex gap-5">
            {branding.logo_url ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft sm:h-20 sm:w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logo_url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/30 text-accent shadow-soft sm:h-20 sm:w-20">
                <Scissors className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {tenant.business_type_label ?? "Book online"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{tenant.name}</h1>
              {branding.tagline ? (
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {branding.tagline}
                </p>
              ) : null}
              {serviceCount > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {serviceCount} service{serviceCount === 1 ? "" : "s"} available to book
                </p>
              ) : null}
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className={cn(
              "h-12 w-full shrink-0 rounded-xl px-10 text-base font-semibold sm:w-auto",
              bookingPrimaryButtonClass
            )}
          >
            <a href="#book" className={bookingPrimaryLinkClass}>
              <CalendarHeart className="mr-2 h-5 w-5 shrink-0 text-white" />
              Book now
            </a>
          </Button>
        </div>
      </header>

      <main className={cn(PAGE_WIDTH, PAGE_PAD, "py-12 sm:py-14 lg:py-16")}>
        <section id="book" className="scroll-mt-24" aria-label="Book an appointment">
          <div className="mb-8 space-y-2 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Book your visit</h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Choose your services, pick a stylist and time, then confirm in a few steps.
            </p>
          </div>
          <BookingWizard
            tenantSlug={tenantSlug}
            tenant={tenant}
            booking={booking}
            catalog={catalog}
            className="w-full"
          />
        </section>

        <div className="my-14 h-px bg-border/60 sm:my-16 lg:my-20" aria-hidden />

        <section className="space-y-8 sm:space-y-10">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">About {tenant.name}</h2>
            {branding.business_description ? (
              <p className="text-base leading-relaxed text-muted-foreground">
                {branding.business_description}
              </p>
            ) : (
              <p className="text-base leading-relaxed text-muted-foreground">
                Book your appointment online — choose your services and preferred time above.
              </p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                {branding.address ?? "Address on file"}
              </p>
              {branding.website_url ? (
                <a
                  href={branding.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Visit website
                </a>
              ) : null}
            </InfoCard>

            <InfoCard title="Hours" icon={Clock}>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {hoursLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </InfoCard>
          </div>

          {(social.instagram || social.facebook || social.tiktok || social.twitter) && (
            <div className="flex flex-wrap gap-3">
              {social.instagram ? <SocialChip href={social.instagram} label="Instagram" /> : null}
              {social.facebook ? <SocialChip href={social.facebook} label="Facebook" /> : null}
              {social.tiktok ? <SocialChip href={social.tiktok} label="TikTok" /> : null}
              {social.twitter ? <SocialChip href={social.twitter} label="X" /> : null}
            </div>
          )}
        </section>

        <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-16 lg:mt-20 lg:space-y-20">
          <PublicServicesSection
            services={services}
            currency={tenant.currency ?? booking?.currency ?? "USD"}
          />

          {storeProducts.length > 0 ? (
            <div className="space-y-5">
              <StoreProductsSection
                products={storeProducts}
                currency={tenant.currency ?? booking?.currency ?? "USD"}
                compact
              />
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/${tenantSlug}/book/shop`}>
                  View full shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}

          <PublicReviewsSection reviews={reviews} />

          {staff.length > 0 ? (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Our team</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Meet the stylists and technicians you can book with.
                </p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {staff.map((member) => (
                  <Card
                    key={member.id}
                    className="min-w-[9.5rem] shrink-0 rounded-2xl border-border/60 shadow-soft"
                  >
                    <CardContent className="p-5 text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/25 text-base font-semibold text-accent">
                        {member.display_name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium">{member.display_name}</p>
                      {member.title ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{member.title}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {portfolio.length > 0 ? (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Portfolio</h3>
                <p className="mt-1 text-sm text-muted-foreground">Before and after from recent work.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {portfolio.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft"
                  >
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
        </div>
      </main>

      {branding.whatsapp ? (
        <FloatingWhatsAppButton
          phoneNumber={branding.whatsapp}
          message={defaultBookingWhatsAppMessage(tenant.name)}
          label={`Chat with ${tenant.name} on WhatsApp`}
        />
      ) : null}

      <footer className="border-t border-border/60 py-12 text-center text-sm text-muted-foreground">
        {showPlatformFooter ? (
          <Link href="/" className="inline-flex items-center gap-2 hover:text-foreground">
            <Scissors className="h-4 w-4 text-accent" />
            Powered by Schedelux
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
    <Card className={cn("rounded-2xl border-border/60 shadow-soft", className)}>
      <CardContent className="space-y-3 p-6 sm:p-7">
        <p className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-accent">
            <Icon className="h-4 w-4" />
          </span>
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
    <span className="flex items-center gap-2.5 text-sm leading-relaxed text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0 text-accent" />
      {children}
    </span>
  );
  if (href) {
    return (
      <a href={href} className="block transition-colors hover:text-foreground">
        {content}
      </a>
    );
  }
  return <div>{content}</div>;
}

function SocialChip({ href, label }: { href: string; label: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:border-accent/40 hover:bg-primary/10"
    >
      {label}
    </a>
  );
}
