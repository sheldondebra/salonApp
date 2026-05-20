"use client";

import {
  Building2,
  Clock,
  Coins,
  Globe,
  Image,
  Mail,
  MapPin,
  Palette,
  Pencil,
  Phone,
  Scissors,
  Store,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  OnboardingExtraContact,
  OnboardingGalleryRow,
  OnboardingServiceRow,
  OnboardingStepKey,
} from "./types";

export type OnboardingReviewData = {
  businessName: string;
  slug: string;
  timezone: string;
  currency: string;
  businessTypeLabels: string[];
  services: OnboardingServiceRow[];
  gallery: OnboardingGalleryRow[];
  businessPhone: string;
  businessEmail: string;
  extraContacts: OnboardingExtraContact[];
  instagram: string;
  facebook: string;
  tiktok: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  addressLine1: string;
  city: string;
  state: string;
  countryName: string;
  multipleLocations: boolean;
  extraLocations: { address: string; city: string }[];
};

type Props = {
  data: OnboardingReviewData;
  onEdit: (step: OnboardingStepKey) => void;
};

type SectionConfig = {
  step: OnboardingStepKey;
  title: string;
  icon: LucideIcon;
};

const SECTIONS: SectionConfig[] = [
  { step: "business", title: "Business profile", icon: Building2 },
  { step: "business_type", title: "Business types", icon: Store },
  { step: "services", title: "Service menu", icon: Scissors },
  { step: "gallery", title: "Before & after gallery", icon: Image },
  { step: "contact", title: "Contact details", icon: Phone },
  { step: "branding", title: "Branding", icon: Palette },
  { step: "location", title: "Location", icon: MapPin },
];

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SectionShell({
  section,
  onEdit,
  children,
}: {
  section: SectionConfig;
  onEdit: (step: OnboardingStepKey) => void;
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="text-sm font-semibold">{section.title}</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 shrink-0"
          onClick={() => onEdit(section.step)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <li className="flex gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{label}: </span>
        <span className="text-muted-foreground">{value}</span>
      </span>
    </li>
  );
}

export function OnboardingReviewStep({ data, onEdit }: Props) {
  const filledServices = data.services.filter((s) => s.name.trim());
  const filledGallery = data.gallery.filter((g) => g.before_image_url && g.after_image_url);
  const socialLines = [
    data.instagram && { label: "Instagram", value: data.instagram },
    data.facebook && { label: "Facebook", value: data.facebook },
    data.tiktok && { label: "TikTok", value: data.tiktok },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review each section below. Use <strong className="font-medium text-foreground">Edit</strong> to change
        anything, then confirm at the bottom to launch your workspace.
      </p>

      <SectionShell section={SECTIONS[0]} onEdit={onEdit}>
        <ul className="space-y-2">
          <DetailRow icon={Building2} label="Business name" value={data.businessName || "—"} />
          <DetailRow icon={Globe} label="Workplace URL" value={data.slug ? `yoursite.com/${data.slug}` : "—"} />
          <DetailRow icon={Clock} label="Timezone" value={data.timezone || "—"} />
          <DetailRow icon={Coins} label="Currency" value={data.currency || "—"} />
        </ul>
      </SectionShell>

      <SectionShell section={SECTIONS[1]} onEdit={onEdit}>
        {data.businessTypeLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No business types selected</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.businessTypeLabels.map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
              >
                <Store className="h-3 w-3" />
                {label}
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell section={SECTIONS[2]} onEdit={onEdit}>
        {filledServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services added yet</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {filledServices.length} service{filledServices.length === 1 ? "" : "s"} · prices in {data.currency}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {filledServices.map((service, index) => (
                <li
                  key={service.id ?? service.uuid ?? `svc-${index}`}
                  className="rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{service.name}</p>
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {formatPrice(service.price_cents, data.currency)}
                    </span>
                  </div>
                  {service.category?.name ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" />
                      {service.category.name}
                    </span>
                  ) : null}
                  {service.description?.trim() ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5">
                      <Clock className="h-3 w-3 text-accent" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5">
                      <Coins className="h-3 w-3 text-accent" />
                      {data.currency}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionShell>

      <SectionShell section={SECTIONS[3]} onEdit={onEdit}>
        {filledGallery.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gallery items yet</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {filledGallery.map((item, index) => (
              <li key={index} className="rounded-xl border border-border bg-muted/30 p-2">
                <p className="mb-2 truncate text-xs font-medium">{item.title || `Gallery ${index + 1}`}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.before_image_url}
                    alt="Before"
                    className="aspect-square rounded-lg object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.after_image_url}
                    alt="After"
                    className="aspect-square rounded-lg object-cover"
                  />
                </div>
                {item.caption ? <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">{item.caption}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell section={SECTIONS[4]} onEdit={onEdit}>
        <ul className="space-y-2">
          <DetailRow icon={Phone} label="Phone" value={data.businessPhone || "—"} />
          <DetailRow icon={Mail} label="Email" value={data.businessEmail || "—"} />
          {data.extraContacts
            .filter((c) => c.label || c.phone || c.email)
            .map((c, i) => (
              <li key={i} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                <p className="font-medium">{c.label || `Contact ${i + 2}`}</p>
                <p className="text-muted-foreground">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </li>
            ))}
          {socialLines.map((s) => (
            <DetailRow key={s.label} icon={Globe} label={s.label} value={s.value} />
          ))}
        </ul>
      </SectionShell>

      <SectionShell section={SECTIONS[5]} onEdit={onEdit}>
        <ul className="space-y-3">
          <DetailRow icon={Palette} label="Tagline" value={data.tagline || "—"} />
          <li className="flex items-center gap-3 text-sm">
            <Palette className="h-4 w-4 text-accent" />
            <span className="font-medium">Colors</span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-md border border-border shadow-inner"
                style={{ backgroundColor: data.primaryColor }}
                title="Primary"
              />
              <span
                className="h-6 w-6 rounded-md border border-border shadow-inner"
                style={{ backgroundColor: data.accentColor }}
                title="Accent"
              />
            </span>
          </li>
          {data.logoUrl ? (
            <li className="flex items-center gap-3">
              <Image className="h-4 w-4 text-accent" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg border object-contain" />
            </li>
          ) : (
            <DetailRow icon={Image} label="Logo" value="Not uploaded" />
          )}
        </ul>
      </SectionShell>

      <SectionShell section={SECTIONS[6]} onEdit={onEdit}>
        <ul className="space-y-2">
          <DetailRow
            icon={MapPin}
            label="Address"
            value={[data.addressLine1, data.city, data.state, data.countryName].filter(Boolean).join(", ") || "—"}
          />
          <DetailRow
            icon={Building2}
            label="Branches"
            value={data.multipleLocations ? "Multiple locations" : "Single location"}
          />
          {data.multipleLocations &&
            data.extraLocations
              .filter((l) => l.address || l.city)
              .map((l, i) => (
                <li key={i} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  {[l.address, l.city].filter(Boolean).join(", ")}
                </li>
              ))}
        </ul>
      </SectionShell>
    </div>
  );
}
