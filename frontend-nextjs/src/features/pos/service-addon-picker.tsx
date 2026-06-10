"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format/money";
import type { ServiceAddon } from "./pos-types";

type ServiceAddonPickerProps = {
  open: boolean;
  serviceName: string;
  currency: string;
  addons: ServiceAddon[];
  loading?: boolean;
  onSelectAddon: (addon: ServiceAddon) => void;
  onSkip: () => void;
  onClose: () => void;
};

export function ServiceAddonPicker({
  open,
  serviceName,
  currency,
  addons,
  loading,
  onSelectAddon,
  onSkip,
  onClose,
}: ServiceAddonPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>Add-ons for {serviceName}</CardTitle>
          <CardDescription>Optional extras — add one or continue without.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading add-ons…</p>
          ) : addons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No add-ons for this service.</p>
          ) : (
            addons.map((addon) => (
              <Button
                key={addon.id}
                type="button"
                variant="outline"
                className="w-full justify-between rounded-xl h-auto py-3 px-4"
                onClick={() => onSelectAddon(addon)}
              >
                <span className="font-medium">{addon.name}</span>
                <span className="text-muted-foreground">+{formatMoney(addon.price_cents, currency)}</span>
              </Button>
            ))
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" className="flex-1 rounded-xl" onClick={onSkip}>
              {addons.length > 0 ? "Service only" : "Continue"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
