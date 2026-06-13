"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Globe,
  Image,
  Link2,
  MapPin,
  Palette,
  Scissors,
  Clock,
  Coins,
} from "lucide-react";
import { BusinessTypePicker, type BusinessTypeOption } from "@/features/onboarding/business-type-picker";
import { OnboardingContactStep } from "@/features/onboarding/onboarding-contact-step";
import { OnboardingGalleryStep } from "@/features/onboarding/onboarding-gallery-step";
import { OnboardingServicesStep } from "@/features/onboarding/onboarding-services-step";
import {
  OnboardingReviewStep,
  type OnboardingReviewData,
} from "@/features/onboarding/onboarding-review-step";
import { OnboardingLaunchOverlay } from "@/features/onboarding/onboarding-launch-overlay";
import { OnboardingStepCards } from "@/features/onboarding/onboarding-step-cards";
import { toast } from "sonner";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Progress } from "@/components/ui/progress";
import { FieldWithIcon } from "@/components/onboarding/field-with-icon";
import { FileUploadButton } from "@/components/onboarding/file-upload-button";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { loginHref } from "@/lib/auth/auth-flow-links";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  US_STATE_OPTIONS,
  parseCountryValue,
  formatCountryValue,
} from "@/lib/onboarding/lookups";
import type {
  OnboardingExtraContact,
  OnboardingGalleryRow,
  OnboardingProgress,
  OnboardingServiceRow,
  OnboardingStepKey,
} from "./types";

const STEP_ORDER: OnboardingStepKey[] = [
  "business",
  "business_type",
  "services",
  "gallery",
  "contact",
  "branding",
  "location",
  "review",
];

export function OnboardingWizard() {
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStepKey>("business");
  const [slugTouched, setSlugTouched] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("Africa/Accra");
  const [currency, setCurrency] = useState("GHS");
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<BusinessTypeOption[]>([]);
  const [serviceRows, setServiceRows] = useState<OnboardingServiceRow[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [galleryRows, setGalleryRows] = useState<OnboardingGalleryRow[]>([]);
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [extraContacts, setExtraContacts] = useState<OnboardingExtraContact[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F8BBD0");
  const [accentColor, setAccentColor] = useState("#E879A6");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [countryValue, setCountryValue] = useState(formatCountryValue("US", "United States"));
  const [multipleLocations, setMultipleLocations] = useState(false);
  const [extraLocations, setExtraLocations] = useState<{ address: string; city: string }[]>([]);

  const mapCatalogServices = (raw: unknown[]): OnboardingServiceRow[] =>
    raw.map((s) => {
      const row = s as OnboardingServiceRow;
      return {
        id: row.id,
        uuid: row.uuid,
        name: row.name,
        description: row.description ?? "",
        duration_minutes: row.duration_minutes ?? 60,
        price_cents: row.price_cents ?? 0,
        service_category_id: row.category?.id ?? row.service_category_id,
        category: row.category,
      };
    });

  const hydrateFromProgress = useCallback((p: OnboardingProgress) => {
    setProgress(p);
    const current = STEP_ORDER.includes(p.current_step) ? p.current_step : "business";
    setStep(current);
    const d = (key: string) => p.steps[key]?.data ?? {};
    setBusinessName(String(d("business").business_name ?? ""));
    setSlug(String(d("business").slug ?? ""));
    setTimezone(String(d("business").timezone ?? "Africa/Accra"));
    setCurrency(String(d("business").currency ?? "GHS"));
    const types = (d("business_type").business_types as string[]) ?? (p.business_type ? [p.business_type] : []);
    setBusinessTypes(Array.isArray(types) ? types : []);
    setBusinessPhone(String(d("contact").business_phone ?? ""));
    setBusinessEmail(String(d("contact").business_email ?? ""));
    const social = d("contact").social as Record<string, string> | undefined;
    if (social) {
      setInstagram(social.instagram ?? "");
      setFacebook(social.facebook ?? "");
      setTiktok(social.tiktok ?? "");
    }
    const contactExtras = d("contact").extra_contacts as OnboardingExtraContact[] | undefined;
    if (Array.isArray(contactExtras)) {
      setExtraContacts(
        contactExtras.slice(0, 3).map((c) => ({
          label: String(c.label ?? ""),
          phone: String(c.phone ?? ""),
          email: String(c.email ?? ""),
        }))
      );
    }
    setTagline(String(d("branding").tagline ?? ""));
    setPrimaryColor(String(d("branding").primary_color ?? "#F8BBD0"));
    setAccentColor(String(d("branding").accent_color ?? "#E879A6"));
    setLogoUrl(String(d("branding").logo_url ?? ""));
    setAddressLine1(String(d("location").address_line1 ?? ""));
    setCity(String(d("location").city ?? ""));
    setState(String(d("location").state ?? ""));
    const cc = String(d("location").country_code ?? "US");
    const cn = String(d("location").country ?? "United States");
    setCountryValue(formatCountryValue(cc, cn));
    setMultipleLocations(Boolean(d("location").multiple_locations));
    const extras = d("location").additional_locations as { address: string; city: string }[] | undefined;
    if (Array.isArray(extras)) setExtraLocations(extras);
  }, []);

  useEffect(() => {
    if (!getApiClientOptions().token) {
      router.replace(loginHref({ next: "/onboarding" }));
      return;
    }
    createApiClient(getApiClientOptions())
      .get<{
        progress: OnboardingProgress;
        business_types: BusinessTypeOption[];
        catalog?: { services?: unknown[]; gallery?: unknown[] };
      }>("/onboarding")
      .then((res) => {
        hydrateFromProgress(res.progress);
        setBusinessTypeOptions(res.business_types ?? []);
        const svcList = Array.isArray(res.catalog?.services) ? res.catalog.services : [];
        if (svcList.length) setServiceRows(mapCatalogServices(svcList));
        const galList = Array.isArray(res.catalog?.gallery) ? res.catalog.gallery : [];
        if (galList.length) {
          setGalleryRows(
            galList.map((g) => {
              const row = g as OnboardingGalleryRow;
              return {
                title: row.title ?? "",
                before_image_url: row.before_image_url,
                after_image_url: row.after_image_url,
                caption: row.caption ?? "",
              };
            })
          );
        }
      })
      .catch(() => toast.error("Could not load onboarding progress"))
      .finally(() => setLoading(false));
  }, [router, hydrateFromProgress]);

  useEffect(() => {
    if (!slugTouched && businessName) {
      setSlug(
        businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [businessName, slugTouched]);

  useEffect(() => {
    if (step !== "services" || serviceRows.length > 0) return;
    createApiClient(getApiClientOptions())
      .get<{ catalog?: { services?: unknown[] } }>("/onboarding")
      .then((res) => {
        const list = Array.isArray(res.catalog?.services) ? res.catalog.services : [];
        if (list.length) setServiceRows(mapCatalogServices(list));
      })
      .catch(() => {});
  }, [step, serviceRows.length]);

  async function saveStep(stepKey: OnboardingStepKey, data: Record<string, unknown>, complete = true) {
    const res = await createApiClient(getApiClientOptions()).patch<{
      progress: OnboardingProgress;
      redirect?: string;
    }>(`/onboarding/steps/${stepKey}`, { data, complete });
    hydrateFromProgress(res.progress);
    return res;
  }

  async function handleSuggestServices() {
    if (businessTypes.length === 0) return;
    setSuggesting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{
        suggestions: Array<{
          name: string;
          description: string;
          duration_minutes: number;
          price_cents: number;
        }>;
      }>(`/onboarding/service-suggestions?types=${businessTypes.join(",")}`);
      const existing = new Set(serviceRows.map((s) => s.name.toLowerCase()));
      const added = (res.suggestions ?? [])
        .filter((s) => !existing.has(s.name.toLowerCase()))
        .map((s) => ({
          name: s.name,
          description: s.description,
          duration_minutes: s.duration_minutes,
          price_cents: s.price_cents,
        }));
      if (added.length) setServiceRows((prev) => [...prev, ...added]);
      else toast.info("No new suggestions to add");
    } catch {
      toast.error("Could not load suggestions");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleNext() {
    setSaving(true);
    try {
      if (step === "business") {
        await saveStep("business", { business_name: businessName, slug, timezone, currency });
        setStep("business_type");
      } else if (step === "business_type") {
        if (businessTypes.length === 0) {
          toast.error("Select at least one business type");
          return;
        }
        await saveStep("business_type", { business_types: businessTypes });
        setStep("services");
      } else if (step === "services") {
        await saveStep("services", {
          services: serviceRows.filter((s) => s.name.trim()).map((s) => ({
            id: s.id,
            uuid: s.uuid,
            name: s.name,
            description: s.description,
            duration_minutes: s.duration_minutes,
            price_cents: s.price_cents,
            service_category_id: s.service_category_id,
          })),
        });
        setStep("gallery");
      } else if (step === "gallery") {
        const filled = galleryRows.filter((r) => r.before_image_url && r.after_image_url);
        await saveStep("gallery", { items: filled });
        setStep("contact");
      } else if (step === "contact") {
        await saveStep("contact", {
          business_phone: businessPhone,
          business_email: businessEmail,
          extra_contacts: extraContacts
            .filter((c) => c.label.trim() || c.phone.trim() || c.email.trim())
            .map((c) => ({
              label: c.label.trim(),
              phone: c.phone.trim(),
              email: c.email.trim(),
            })),
          social: { instagram, facebook, tiktok },
        });
        setStep("branding");
      } else if (step === "branding") {
        await saveStep("branding", {
          tagline,
          primary_color: primaryColor,
          accent_color: accentColor,
          logo_url: logoUrl || undefined,
        });
        setStep("location");
      } else if (step === "location") {
        const { code, name } = parseCountryValue(countryValue);
        await saveStep("location", {
          address_line1: addressLine1,
          city,
          state,
          country: name,
          country_code: code,
          multiple_locations: multipleLocations,
          additional_locations: multipleLocations ? extraLocations : [],
        });
        setStep("review");
      } else if (step === "review") {
        setLaunching(true);
        const res = await saveStep("review", { confirmed: true }, true);
        if (res.redirect) {
          setPendingRedirect(res.redirect);
        } else {
          setLaunching(false);
          toast.error("Could not finish setup");
        }
      }
    } catch (err) {
      setLaunching(false);
      toast.error(err instanceof ApiError ? err.message : "Could not save step");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  const { code: countryCode, name: countryName } = parseCountryValue(countryValue);
  const reviewData: OnboardingReviewData = {
    businessName,
    slug,
    timezone,
    currency,
    businessTypeLabels: businessTypes.map((k) => businessTypeOptions.find((o) => o.key === k)?.label ?? k),
    services: serviceRows,
    gallery: galleryRows,
    businessPhone,
    businessEmail,
    extraContacts,
    instagram,
    facebook,
    tiktok,
    tagline,
    primaryColor,
    accentColor,
    logoUrl,
    addressLine1,
    city,
    state,
    countryName,
    multipleLocations,
    extraLocations,
  };

  const percent = progress?.percent ?? 0;

  return (
    <>
      <OnboardingLaunchOverlay
        active={launching}
        onDone={() => {
          setLaunching(false);
          toast.success("Welcome to Schedelux!");
          router.push(pendingRedirect ?? "/");
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
        <header className="border-b border-border/60 bg-card/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            <AuthBackLink href="/" label="Back to home" />
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Scissors className="h-5 w-5 text-accent" />
              Schedelux — Set up your salon
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Setup progress</span>
              <span className="text-muted-foreground">
                {progress?.completed_count ?? 0} of {progress?.total ?? STEP_ORDER.length} steps · {percent}%
              </span>
            </div>
            <Progress value={percent} />
            <OnboardingStepCards
              stepOrder={STEP_ORDER}
              progress={progress}
              currentStep={step}
              onSelectStep={setStep}
              disabled={loading || saving || launching}
            />
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{progress?.steps[step]?.label ?? "Setup"}</CardTitle>
              <CardDescription>
                Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <>
                  {step === "business" && (
                    <>
                      <FieldWithIcon label="Business name" icon={Building2}>
                        <Input
                          placeholder="e.g. Mission Salon"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </FieldWithIcon>
                      <FieldWithIcon label="Workplace URL" icon={Link2}>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>yoursite.com/</span>
                          <Input
                            placeholder="mission-salon"
                            value={slug}
                            onChange={(e) => {
                              setSlugTouched(true);
                              setSlug(e.target.value);
                            }}
                            className="flex-1"
                          />
                        </div>
                        {businessName ? (
                          <p className="text-xs text-accent">Suggested from your business name</p>
                        ) : null}
                      </FieldWithIcon>
                      <FieldWithIcon label="Timezone" icon={Clock}>
                        <Combobox
                          options={TIMEZONE_OPTIONS}
                          value={timezone}
                          onValueChange={setTimezone}
                          placeholder="Search timezone…"
                          searchPlaceholder="Type to search…"
                        />
                      </FieldWithIcon>
                      <FieldWithIcon label="Currency" icon={Coins}>
                        <Combobox
                          options={CURRENCY_OPTIONS}
                          value={currency}
                          onValueChange={setCurrency}
                          placeholder="Search currency…"
                          searchPlaceholder="GHS, USD, EUR…"
                        />
                      </FieldWithIcon>
                    </>
                  )}

                  {step === "business_type" && (
                    <BusinessTypePicker
                      options={businessTypeOptions}
                      value={businessTypes}
                      onChange={setBusinessTypes}
                    />
                  )}

                  {step === "services" && (
                    <OnboardingServicesStep
                      services={serviceRows}
                      currency={currency}
                      onChange={setServiceRows}
                      onSuggestMore={handleSuggestServices}
                      suggesting={suggesting}
                    />
                  )}

                  {step === "gallery" && (
                    <OnboardingGalleryStep items={galleryRows} onChange={setGalleryRows} />
                  )}

                  {step === "contact" && (
                    <OnboardingContactStep
                      businessPhone={businessPhone}
                      businessEmail={businessEmail}
                      extraContacts={extraContacts}
                      instagram={instagram}
                      facebook={facebook}
                      tiktok={tiktok}
                      onBusinessPhoneChange={setBusinessPhone}
                      onBusinessEmailChange={setBusinessEmail}
                      onExtraContactsChange={setExtraContacts}
                      onInstagramChange={setInstagram}
                      onFacebookChange={setFacebook}
                      onTiktokChange={setTiktok}
                    />
                  )}

                  {step === "branding" && (
                    <>
                      <FieldWithIcon label="Tagline" icon={Palette}>
                        <Input
                          placeholder="Where beauty meets calm"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                        />
                      </FieldWithIcon>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldWithIcon label="Primary color" icon={Palette}>
                          <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10" />
                        </FieldWithIcon>
                        <FieldWithIcon label="Accent color" icon={Palette}>
                          <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10" />
                        </FieldWithIcon>
                      </div>
                      <FieldWithIcon label="Business logo" icon={Image}>
                        <div className="flex flex-wrap items-center gap-3">
                          <FileUploadButton label="Upload logo" purpose="logo" onUploaded={setLogoUrl} />
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain border" />
                          ) : null}
                        </div>
                      </FieldWithIcon>
                    </>
                  )}

                  {step === "location" && (
                    <>
                      <FieldWithIcon label="Street address" icon={MapPin}>
                        <Input
                          placeholder="123 Main Street"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                        />
                      </FieldWithIcon>
                      <FieldWithIcon label="Country" icon={Globe}>
                        <Combobox
                          options={COUNTRY_OPTIONS}
                          value={countryValue}
                          onValueChange={setCountryValue}
                          placeholder="Search country…"
                        />
                      </FieldWithIcon>
                      {countryCode === "US" ? (
                        <FieldWithIcon label="State" icon={MapPin}>
                          <Combobox
                            options={US_STATE_OPTIONS}
                            value={state}
                            onValueChange={setState}
                            placeholder="Search state…"
                          />
                        </FieldWithIcon>
                      ) : (
                        <FieldWithIcon label="State / Region" icon={MapPin}>
                          <Input
                            placeholder="State or region"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </FieldWithIcon>
                      )}
                      <FieldWithIcon label="City" icon={MapPin}>
                        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                      </FieldWithIcon>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={multipleLocations}
                          onChange={(e) => setMultipleLocations(e.target.checked)}
                          className="rounded border-border"
                        />
                        I have multiple salon branches
                      </label>
                      {multipleLocations ? (
                        <div className="space-y-3 border-t border-border pt-3">
                          <p className="text-sm font-medium">Additional branch addresses</p>
                          {extraLocations.map((loc, i) => (
                            <div key={i} className="grid gap-2 sm:grid-cols-2">
                              <Input
                                placeholder="Branch address"
                                value={loc.address}
                                onChange={(e) => {
                                  const next = [...extraLocations];
                                  next[i] = { ...next[i], address: e.target.value };
                                  setExtraLocations(next);
                                }}
                              />
                              <Input
                                placeholder="City"
                                value={loc.city}
                                onChange={(e) => {
                                  const next = [...extraLocations];
                                  next[i] = { ...next[i], city: e.target.value };
                                  setExtraLocations(next);
                                }}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setExtraLocations([...extraLocations, { address: "", city: "" }])}
                          >
                            Add another branch
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}

                  {step === "review" && (
                    <OnboardingReviewStep data={reviewData} onEdit={setStep} />
                  )}

                  <div className="flex gap-3 pt-4">
                    {STEP_ORDER.indexOf(step) > 0 && (
                      <Button type="button" variant="outline" onClick={goBack} disabled={saving || launching}>
                        Back
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleNext}
                      disabled={
                        saving ||
                        launching ||
                        loading ||
                        (step === "business_type" && businessTypes.length === 0)
                      }
                    >
                      {launching ? "Launching…" : saving ? "Saving…" : step === "review" ? "Confirm & launch" : "Continue"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
