"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link2, MousePointerClick, Share2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { MarketingSocialLinksOverview } from "@/lib/api/types";

type SocialLinksViewProps = {
  tenantSlug: string;
};

export function SocialLinksView({ tenantSlug }: SocialLinksViewProps) {
  const [overview, setOverview] = useState<MarketingSocialLinksOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<MarketingSocialLinksOverview>(
        `/${tenantSlug}/marketing/social-links`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load social links");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Profile views" value={String(overview?.profile_views ?? 0)} icon={Share2} />
        <MetricCard title="Link clicks" value={String(overview?.link_clicks ?? 0)} icon={MousePointerClick} />
        <MetricCard title="Bookings from social" value={String(overview?.bookings_from_social ?? 0)} icon={Link2} />
        <MetricCard title="Active links" value={String((overview?.links ?? []).filter((link) => link.is_active).length)} icon={ExternalLink} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Social booking hub</CardTitle>
          <CardDescription>
            Share one branded link and track which channels convert best.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Bio</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {overview?.bio ?? "Add a short bio to explain your brand and drive bookings."}
            </p>
            {overview?.share_url ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-background px-3 py-1 text-xs">{overview.share_url}</code>
                <Button size="sm" variant="outline" asChild>
                  <a href={overview.share_url} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </Button>
              </div>
            ) : null}
          </div>

          <DataTable
            columns={[
              {
                id: "platform",
                header: "Platform",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.platform}</p>
                  </div>
                ),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.is_active ? "success" : "secondary"}>
                    {row.is_active ? "Live" : "Draft"}
                  </Badge>
                ),
              },
              { id: "clicks", header: "Clicks", cell: (row) => row.clicks },
              { id: "conversions", header: "Bookings", cell: (row) => row.conversions },
              {
                id: "url",
                header: "Link",
                cell: (row) => (
                  <a
                    href={row.url}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ),
              },
            ]}
            data={overview?.links ?? []}
            rowKey={(row) => row.platform}
            loading={loading}
            emptyIcon={Share2}
            emptyTitle="No social links yet"
            emptyDescription="Connect social destinations to start tracking bookings from bio links."
          />
        </CardContent>
      </Card>
    </div>
  );
}
