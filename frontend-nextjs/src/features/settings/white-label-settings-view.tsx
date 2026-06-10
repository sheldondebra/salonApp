"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Paintbrush, Scissors, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { WhiteLabelSettings } from "@/lib/api/types";

type WhiteLabelSettingsViewProps = {
  tenantSlug: string;
};

const emptySettings: WhiteLabelSettings = {
  custom_domain: "",
  app_name: "",
  support_email: "",
  logo_url: "",
  favicon_url: "",
  login_background_url: "",
  primary_color: "#111827",
  accent_color: "#ec4899",
  email_from_name: "",
  email_from_address: "",
  custom_help_url: "",
  hide_beautyos_branding: false,
  dns_status: "unverified",
  updated_at: null,
};

export function WhiteLabelSettingsView({ tenantSlug }: WhiteLabelSettingsViewProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<WhiteLabelSettings>(
        `/${tenantSlug}/settings/white-label`
      );
      setSettings({ ...emptySettings, ...result });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load white-label settings");
      setSettings(emptySettings);
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
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/settings/white-label`, settings);
      toast.success("White-label settings saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save white-label settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="App name" value={settings.app_name || "Schedelux"} icon={Scissors} />
        <MetricCard title="Custom domain" value={settings.custom_domain || "Not set"} icon={Globe} />
        <MetricCard title="DNS status" value={settings.dns_status} icon={ShieldCheck} />
        <MetricCard title="Branding hidden" value={settings.hide_beautyos_branding ? "Yes" : "No"} icon={Paintbrush} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>White-label settings</CardTitle>
          <CardDescription>
            Customize the hosted domain, brand assets, and outbound communication identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>App name</Label>
            <Input value={settings.app_name} onChange={(event) => setSettings((current) => ({ ...current, app_name: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Custom domain</Label>
            <Input value={settings.custom_domain ?? ""} onChange={(event) => setSettings((current) => ({ ...current, custom_domain: event.target.value }))} disabled={loading} placeholder="app.yoursalon.com" />
          </div>
          <div className="space-y-2">
            <Label>Support email</Label>
            <Input value={settings.support_email ?? ""} onChange={(event) => setSettings((current) => ({ ...current, support_email: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Help URL</Label>
            <Input value={settings.custom_help_url ?? ""} onChange={(event) => setSettings((current) => ({ ...current, custom_help_url: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Primary color</Label>
            <Input value={settings.primary_color} onChange={(event) => setSettings((current) => ({ ...current, primary_color: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Accent color</Label>
            <Input value={settings.accent_color} onChange={(event) => setSettings((current) => ({ ...current, accent_color: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={settings.logo_url ?? ""} onChange={(event) => setSettings((current) => ({ ...current, logo_url: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input value={settings.favicon_url ?? ""} onChange={(event) => setSettings((current) => ({ ...current, favicon_url: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Login background URL</Label>
            <Input value={settings.login_background_url ?? ""} onChange={(event) => setSettings((current) => ({ ...current, login_background_url: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Email from name</Label>
            <Input value={settings.email_from_name ?? ""} onChange={(event) => setSettings((current) => ({ ...current, email_from_name: event.target.value }))} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Email from address</Label>
            <Input value={settings.email_from_address ?? ""} onChange={(event) => setSettings((current) => ({ ...current, email_from_address: event.target.value }))} disabled={loading} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={settings.hide_beautyos_branding}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  hide_beautyos_branding: event.target.checked,
                }))
              }
              disabled={loading}
            />
            Hide Schedelux branding on hosted pages
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Badge variant={settings.dns_status === "verified" ? "success" : "secondary"}>
              DNS {settings.dns_status}
            </Badge>
            <Button disabled={saving || loading} onClick={() => void save()}>
              {saving ? "Saving..." : "Save white-label settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
