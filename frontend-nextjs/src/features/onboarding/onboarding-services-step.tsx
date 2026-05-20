"use client";

import { Plus, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingServiceRow } from "./types";

type Props = {
  services: OnboardingServiceRow[];
  currency: string;
  onChange: (services: OnboardingServiceRow[]) => void;
  onSuggestMore?: () => void;
  suggesting?: boolean;
};

export function OnboardingServicesStep({ services, currency, onChange, onSuggestMore, suggesting }: Props) {
  function update(index: number, patch: Partial<OnboardingServiceRow>) {
    onChange(services.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addCustom() {
    onChange([
      ...services,
      {
        name: "",
        description: "",
        duration_minutes: 60,
        price_cents: 0,
      },
    ]);
  }

  function priceDollars(cents: number) {
    return (cents / 100).toFixed(2);
  }

  function setPrice(index: number, dollars: string) {
    const cents = Math.round(parseFloat(dollars || "0") * 100);
    update(index, { price_cents: Number.isNaN(cents) ? 0 : cents });
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete business type first — starter services will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Service descriptions, duration, and pricing ({currency}) shown on your booking page.
      </p>
      {services.map((service, index) => (
        <div
          key={service.id ?? service.uuid ?? `new-${index}`}
          className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-accent" />
            {service.id || service.uuid ? (
              <p className="font-semibold">{service.name}</p>
            ) : (
              <Input
                placeholder="Custom service name"
                value={service.name}
                onChange={(e) => update(index, { name: e.target.value })}
                className="max-w-xs"
              />
            )}
          </div>
          {service.category?.name ? (
            <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{service.category.name}</span>
          ) : null}
          <div className="space-y-2">
            <Label>Service description</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={service.description}
              onChange={(e) => update(index, { description: e.target.value })}
              placeholder="What is included in this service?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={service.duration_minutes}
                onChange={(e) => update(index, { duration_minutes: parseInt(e.target.value, 10) || 60 })}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label>Price ({currency})</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={priceDollars(service.price_cents)}
                onChange={(e) => setPrice(index, e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addCustom}>
          <Plus className="h-4 w-4" />
          Add custom service
        </Button>
        {onSuggestMore ? (
          <Button type="button" variant="secondary" size="sm" onClick={onSuggestMore} disabled={suggesting}>
            {suggesting ? "Loading…" : "Suggest more for my business types"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
