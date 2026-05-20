"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import {
  defaultOpeningHours,
  normalizeOpeningHours,
  WEEKDAYS,
  type OpeningHoursDay,
} from "@/lib/branding/opening-hours";
import type { Tenant, TenantSocialLinks } from "@/lib/api/types";

type BrandingSettingsFormProps = {
  tenantSlug: string;
  tenant: Tenant | null;
};

export function BrandingSettingsForm({ tenantSlug, tenant }: BrandingSettingsFormProps) {
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F8BBD0");
  const [accentColor, setAccentColor] = useState("#E879A6");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [hours, setHours] = useState<OpeningHoursDay[]>(defaultOpeningHours());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => {
    if (!tenant) return;
    const b = tenant.branding;
    setTagline(b.tagline ?? "");
    setDescription(b.business_description ?? "");
    setLogoUrl(b.logo_url ?? "");
    setBannerUrl(b.banner_url ?? "");
    setBusinessPhone(b.business_phone ?? "");
    setBusinessEmail(b.business_email ?? "");
    setWhatsapp(b.whatsapp ?? "");
    setWebsiteUrl(b.website_url ?? "");
    setPrimaryColor(b.primary_color ?? "#F8BBD0");
    setAccentColor(b.accent_color ?? "#E879A6");
    setInstagram(b.social?.instagram ?? "");
    setFacebook(b.social?.facebook ?? "");
    setTiktok(b.social?.tiktok ?? "");
    setHours(normalizeOpeningHours(b.opening_hours));
  }, [tenant]);

  async function uploadImage(purpose: "logo" | "banner", file: File) {
    setUploading(purpose);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", purpose);
      const token = getApiClientOptions().token;
      const url = `${env.apiUrl}/api/v1/${tenantSlug}/settings/upload`;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) throw new Error(json.message ?? "Upload failed");
      if (purpose === "logo") setLogoUrl(json.url ?? "");
      else setBannerUrl(json.url ?? "");
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const social: TenantSocialLinks = {
        instagram: instagram || null,
        facebook: facebook || null,
        tiktok: tiktok || null,
      };
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/settings`, {
        tagline,
        business_description: description,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        business_phone: businessPhone,
        business_email: businessEmail,
        whatsapp,
        website_url: websiteUrl || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        social,
        opening_hours: hours,
      });
      toast.success("Branding saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const bookPreview = `/${tenantSlug}/book`;

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Public booking page</CardTitle>
          <CardDescription>Logo, colors, contact info, and hours shown to clients</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-1 rounded-xl" asChild>
          <a href={bookPreview} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Preview page
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input className="rounded-xl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
            <UploadButton
              label={uploading === "logo" ? "Uploading…" : "Upload logo"}
              disabled={uploading !== null}
              onFile={(f) => uploadImage("logo", f)}
            />
          </div>
          <div className="space-y-2">
            <Label>Banner URL</Label>
            <Input className="rounded-xl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
            <UploadButton
              label={uploading === "banner" ? "Uploading…" : "Upload banner"}
              disabled={uploading !== null}
              onFile={(f) => uploadImage("banner", f)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Brand color</Label>
            <Input id="primary_color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent color</Label>
            <Input id="accent_color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input className="rounded-xl" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short headline on your booking page" />
        </div>

        <div className="space-y-2">
          <Label>Business description</Label>
          <textarea
            className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell clients about your salon, specialties, and vibe…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input className="rounded-xl" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input className="rounded-xl" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+233…" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" className="rounded-xl" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Website</Label>
            <Input className="rounded-xl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Social links</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input className="rounded-xl" placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <Input className="rounded-xl" placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            <Input className="rounded-xl" placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Opening hours</Label>
          <div className="space-y-2 rounded-xl border border-border p-3">
            {hours.map((row, index) => {
              const label = WEEKDAYS.find((d) => d.key === row.day)?.label ?? row.day;
              return (
                <div key={row.day} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-sm sm:grid-cols-[120px_1fr_1fr_auto]">
                  <span className="font-medium">{label}</span>
                  <Input
                    type="time"
                    className="h-9 rounded-lg"
                    value={row.open}
                    disabled={row.closed}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((h, i) => (i === index ? { ...h, open: e.target.value } : h))
                      )
                    }
                  />
                  <Input
                    type="time"
                    className="h-9 rounded-lg"
                    value={row.close}
                    disabled={row.closed}
                    onChange={(e) =>
                      setHours((prev) =>
                        prev.map((h, i) => (i === index ? { ...h, close: e.target.value } : h))
                      )
                    }
                  />
                  <label className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                    <input
                      type="checkbox"
                      checked={row.closed}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((h, i) => (i === index ? { ...h, closed: e.target.checked } : h))
                        )
                      }
                    />
                    Closed
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save branding"}
        </Button>
      </CardContent>
    </Card>
  );
}

function UploadButton({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-accent hover:underline">
      <Upload className="h-3.5 w-3.5" />
      <span>{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
