"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Globe2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { AnalyticsIntegrationSettings, IntegrationEvent } from "@/lib/api/types";

type IntegrationsSettingsViewProps = {
  tenantSlug: string;
};

type IntegrationTab = "ga" | "meta";

export function IntegrationsSettingsView({ tenantSlug }: IntegrationsSettingsViewProps) {
  const [settings, setSettings] = useState<AnalyticsIntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<IntegrationTab>("ga");
  const [gaId, setGaId] = useState("");
  const [metaId, setMetaId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<AnalyticsIntegrationSettings>(
        `/${tenantSlug}/settings/integrations`
      );
      setSettings(result);
      setGaId(result.ga_measurement_id ?? "");
      setMetaId(result.meta_pixel_id ?? "");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load integrations");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleEvents = useMemo(
    () =>
      (settings?.event_catalog ?? []).filter((event) =>
        tab === "ga" ? event.destination === "ga" : event.destination === "meta_pixel"
      ),
    [settings?.event_catalog, tab]
  );

  async function save() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/settings/integrations`, {
        ga_measurement_id: gaId || null,
        meta_pixel_id: metaId || null,
        ga_enabled: Boolean(gaId),
        meta_enabled: Boolean(metaId),
      });
      toast.success("Integration settings saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save integration settings");
    } finally {
      setSaving(false);
    }
  }

  function EventStatus({ event }: { event: IntegrationEvent }) {
    return (
      <Badge variant={event.enabled ? "success" : "secondary"}>
        {event.enabled ? "Enabled" : "Optional"}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="GA events"
          value={String((settings?.event_catalog ?? []).filter((event) => event.destination === "ga").length)}
          icon={BarChart3}
        />
        <MetricCard
          title="Meta events"
          value={String(
            (settings?.event_catalog ?? []).filter((event) => event.destination === "meta_pixel")
              .length
          )}
          icon={Share2}
        />
        <MetricCard
          title="Consent mode"
          value={settings?.consent_mode ?? "—"}
          icon={Globe2}
        />
        <MetricCard
          title="Updated"
          value={settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString() : "—"}
          icon={Globe2}
        />
      </div>

      <PageTabs
        tabs={[
          { id: "ga", label: "Google Analytics", icon: <BarChart3 className="h-4 w-4" /> },
          { id: "meta", label: "Meta Pixel", icon: <Share2 className="h-4 w-4" /> },
        ]}
        value={tab}
        onChange={(value) => setTab(value as IntegrationTab)}
      />

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>{tab === "ga" ? "Google Analytics" : "Meta Pixel"}</CardTitle>
            <CardDescription>
              Connect tracking IDs and review which booking events are emitted to each destination.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tab === "ga" ? (
              <>
                <div className="space-y-2">
                  <Label>Measurement ID</Label>
                  <Input value={gaId} onChange={(event) => setGaId(event.target.value)} placeholder="G-XXXXXXXXXX" />
                </div>
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  API secret: {settings?.ga_api_secret_masked ?? "Not configured"}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Pixel ID</Label>
                  <Input value={metaId} onChange={(event) => setMetaId(event.target.value)} placeholder="123456789012345" />
                </div>
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  Access token: {settings?.meta_access_token_masked ?? "Not configured"}
                </div>
              </>
            )}
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : `Save ${tab === "ga" ? "Google Analytics" : "Meta Pixel"}`}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Tracked events</CardTitle>
            <CardDescription>
              Core lifecycle events that can be streamed to analytics destinations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "label",
                  header: "Event",
                  mobilePrimary: true,
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.key}</p>
                    </div>
                  ),
                },
                { id: "category", header: "Category", cell: (row) => row.category },
                {
                  id: "status",
                  header: "Status",
                  cell: (row) => <EventStatus event={row} />,
                },
                {
                  id: "last_sent",
                  header: "Last sent",
                  cell: (row) =>
                    row.last_sent_at ? new Date(row.last_sent_at).toLocaleString() : "Not sent yet",
                },
              ]}
              data={visibleEvents}
              rowKey={(row) => row.key}
              loading={loading}
              emptyIcon={Globe2}
              emptyTitle="No events configured"
              emptyDescription="Add a tracking destination to view emitted booking and marketing events."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
