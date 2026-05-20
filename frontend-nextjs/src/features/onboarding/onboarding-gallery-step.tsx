"use client";

import { Plus, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadButton } from "@/components/onboarding/file-upload-button";
import type { OnboardingGalleryRow } from "./types";

type Props = {
  items: OnboardingGalleryRow[];
  onChange: (items: OnboardingGalleryRow[]) => void;
};

const EMPTY: OnboardingGalleryRow = {
  title: "",
  before_image_url: "",
  after_image_url: "",
  caption: "",
};

export function OnboardingGalleryStep({ items, onChange }: Props) {
  const rows = items.length > 0 ? items : [{ ...EMPTY }];

  function update(index: number, patch: Partial<OnboardingGalleryRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload images or paste URLs for before & after transformations.
      </p>
      {rows.map((row, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-accent" />
              Gallery item {index + 1}
            </div>
            {rows.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <Input
            placeholder="Title (e.g. Balayage transformation)"
            value={row.title ?? ""}
            onChange={(e) => update(index, { title: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Before</Label>
              <Input
                placeholder="https://… or upload"
                value={row.before_image_url}
                onChange={(e) => update(index, { before_image_url: e.target.value })}
              />
              <FileUploadButton
                label="Upload before"
                purpose="gallery_before"
                onUploaded={(url) => update(index, { before_image_url: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>After</Label>
              <Input
                placeholder="https://… or upload"
                value={row.after_image_url}
                onChange={(e) => update(index, { after_image_url: e.target.value })}
              />
              <FileUploadButton
                label="Upload after"
                purpose="gallery_after"
                onUploaded={(url) => update(index, { after_image_url: url })}
              />
            </div>
          </div>
          {(row.before_image_url || row.after_image_url) && (
            <div className="grid grid-cols-2 gap-2">
              {row.before_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.before_image_url} alt="Before" className="h-24 w-full rounded-lg object-cover" />
              ) : null}
              {row.after_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.after_image_url} alt="After" className="h-24 w-full rounded-lg object-cover" />
              ) : null}
            </div>
          )}
          <Input
            placeholder="Caption — describe the result"
            value={row.caption ?? ""}
            onChange={(e) => update(index, { caption: e.target.value })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onChange([...rows, { ...EMPTY }])}>
        <Plus className="h-4 w-4" />
        Add another pair
      </Button>
    </div>
  );
}
