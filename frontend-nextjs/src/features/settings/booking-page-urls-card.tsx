"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { SettingsSectionHeader } from "@/features/settings/settings-ui";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Tenant, TenantDomain } from "@/lib/api/types";

type BookingPageUrlsCardProps = {
  tenantSlug: string;
  domains?: TenantDomain[];
};

function copyText(text: string) {
  void navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export function BookingPageUrlsCard({ tenantSlug, domains: domainsProp }: BookingPageUrlsCardProps) {
  const [domains, setDomains] = useState<TenantDomain[]>(domainsProp ?? []);

  useEffect(() => {
    if (domainsProp?.length) setDomains(domainsProp);
  }, [domainsProp]);

  useEffect(() => {
    if (domainsProp?.length) return;
    createApiClient(getApiClientOptions())
      .get<{ tenant: Tenant }>(`/${tenantSlug}/context`)
      .then((res) => {
        if (res.tenant?.domains?.length) setDomains(res.tenant.domains);
      })
      .catch(() => {});
  }, [tenantSlug, domainsProp]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : `https://${env.workplaceHost || "localhost:3000"}`;

  const workspaceUrl = `${origin}/${tenantSlug}/book`;
  const verifiedCustom = domains?.find((d) => d.is_verified);

  return (
    <Card className="rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={Link2}
        title="Booking page URLs"
        description="Share your workspace link or use a verified custom domain. Add a WhatsApp number under Branding to show a chat button on this page."
        action={
          <Button variant="outline" size="sm" className="rounded-xl gap-2" asChild>
            <a href={workspaceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open page
            </a>
          </Button>
        }
      />
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workspace link
          </p>
          <p className="mt-2 break-all font-mono text-sm">{workspaceUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => copyText(workspaceUrl)}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" />
            Custom domain
          </p>
          {verifiedCustom ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Active:{" "}
              <span className="font-medium text-foreground">{verifiedCustom.domain}</span> — clients
              land on your booking page at the site root.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Point your domain CNAME to this app. Once verified in admin, visitors opening your
              domain see your branded booking page automatically.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
