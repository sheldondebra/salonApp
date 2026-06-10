"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { MarketplaceProfile } from "@/lib/api/types";

type MarketplaceProfileViewProps = {
  tenantSlug: string;
};

const emptyProfile: MarketplaceProfile = {
  id: 0,
  slug: "",
  business_name: "",
  headline: "",
  description: "",
  cover_image_url: "",
  logo_url: "",
  city: "",
  region: "",
  rating: null,
  review_count: 0,
  booking_url: "",
  accepts_walkins: false,
  is_featured: false,
  listing_status: "draft",
  specialties: [],
  service_tags: [],
};

export function MarketplaceProfileView({ tenantSlug }: MarketplaceProfileViewProps) {
  const [profile, setProfile] = useState<MarketplaceProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<MarketplaceProfile>(
        `/${tenantSlug}/marketplace/profile`
      );
      setProfile({ ...emptyProfile, ...result });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load marketplace profile");
      setProfile(emptyProfile);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/marketplace/profile`, {
        headline: profile.headline,
        bio: profile.description,
        categories: profile.specialties ?? [],
        photos: [profile.cover_image_url, profile.logo_url].filter(Boolean),
        is_published: profile.listing_status === "published",
      });
      toast.success("Marketplace profile saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save marketplace profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Status" value={profile.listing_status} icon={Globe2} />
        <MetricCard title="Featured" value={profile.is_featured ? "Yes" : "No"} icon={Star} />
        <MetricCard title="Reviews" value={String(profile.review_count)} icon={Star} />
        <MetricCard title="Location" value={profile.city || "—"} icon={MapPin} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Marketplace profile</CardTitle>
          <CardDescription>
            Control how your salon appears in Schedelux marketplace search and featured placements.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input
              value={profile.business_name}
              onChange={(event) =>
                setProfile((current) => ({ ...current, business_name: event.target.value }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={profile.slug}
              onChange={(event) =>
                setProfile((current) => ({ ...current, slug: event.target.value }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Headline</Label>
            <Input
              value={profile.headline ?? ""}
              onChange={(event) =>
                setProfile((current) => ({ ...current, headline: event.target.value }))
              }
              disabled={loading}
              placeholder="Luxury color, braids, nails, or skin treatments"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              value={profile.description ?? ""}
              onChange={(event) =>
                setProfile((current) => ({ ...current, description: event.target.value }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={profile.city ?? ""}
              onChange={(event) => setProfile((current) => ({ ...current, city: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Input
              value={profile.region ?? ""}
              onChange={(event) =>
                setProfile((current) => ({ ...current, region: event.target.value }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Specialties (comma separated)</Label>
            <Input
              value={profile.specialties.join(", ")}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  specialties: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Service tags (comma separated)</Label>
            <Input
              value={profile.service_tags.join(", ")}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  service_tags: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                }))
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Booking URL</Label>
            <Input
              value={profile.booking_url ?? ""}
              onChange={(event) =>
                setProfile((current) => ({ ...current, booking_url: event.target.value }))
              }
              disabled={loading}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={profile.accepts_walkins}
              onChange={(event) =>
                setProfile((current) => ({ ...current, accepts_walkins: event.target.checked }))
              }
              disabled={loading}
            />
            Accept walk-ins
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button disabled={saving || loading} onClick={() => void save()}>
              {saving ? "Saving..." : "Save marketplace profile"}
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => void load()}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
