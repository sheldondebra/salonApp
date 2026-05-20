"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PortfolioGalleryItem } from "@/features/onboarding/types";

type GalleryRow = {
  id?: number;
  title: string;
  before_image_url: string;
  after_image_url: string;
  caption: string;
};

const emptyGalleryRow = (): GalleryRow => ({
  title: "",
  before_image_url: "",
  after_image_url: "",
  caption: "",
});

type PortfolioGallerySectionProps = { tenantSlug: string };

export function PortfolioGallerySection({ tenantSlug }: PortfolioGallerySectionProps) {
  const [gallery, setGallery] = useState<GalleryRow[]>([emptyGalleryRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: PortfolioGalleryItem[] }>(
        `/${tenantSlug}/portfolio-gallery`
      );
      const galData = Array.isArray(res.data) ? res.data : [];
      setGallery(
        galData.length
          ? galData.map((g) => ({
              id: g.id,
              title: g.title ?? "",
              before_image_url: g.before_image_url,
              after_image_url: g.after_image_url,
              caption: g.caption ?? "",
            }))
          : [emptyGalleryRow()]
      );
    } catch {
      setGallery([emptyGalleryRow()]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  function updateGallery(index: number, patch: Partial<GalleryRow>) {
    setGallery((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    try {
      const filled = gallery.filter((g) => g.before_image_url && g.after_image_url);
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/portfolio-gallery/sync`, {
        items: filled.map((g) => ({
          title: g.title || undefined,
          before_image_url: g.before_image_url,
          after_image_url: g.after_image_url,
          caption: g.caption || undefined,
        })),
      });
      toast.success("Gallery saved");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save gallery");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Before & after gallery</CardTitle>
          <CardDescription>Showcase transformations on your public booking page</CardDescription>
        </div>
        <Button className="rounded-xl" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save gallery"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {gallery.map((row, index) => (
          <div key={row.id ?? index} className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Before URL</Label>
                <Input value={row.before_image_url} onChange={(e) => updateGallery(index, { before_image_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>After URL</Label>
                <Input value={row.after_image_url} onChange={(e) => updateGallery(index, { after_image_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input value={row.caption} onChange={(e) => updateGallery(index, { caption: e.target.value })} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setGallery((p) => [...p, emptyGalleryRow()])}>
          <Plus className="h-4 w-4" />
          Add gallery pair
        </Button>
      </CardContent>
    </Card>
  );
}
