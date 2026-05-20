"use client";

import { useEffect, useState } from "react";
import { Copy, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
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
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-accent" />
          Booking page URLs
        </CardTitle>
        <CardDescription>
          Share your default workspace link or connect a custom domain (CNAME) for a branded root URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace link
          </p>
          <p className="mt-1 break-all text-sm font-medium">{workspaceUrl}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1 rounded-lg"
            onClick={() => copyText(workspaceUrl)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Globe className="h-4 w-4 text-accent" />
            Custom domain
          </p>
          {verifiedCustom ? (
            <p className="mt-2">
              Active domain:{" "}
              <span className="font-medium text-foreground">{verifiedCustom.domain}</span> — clients
              see your booking page at the site root.
            </p>
          ) : (
            <p className="mt-2">
              Point your domain CNAME to this app. Once verified in admin, visitors opening your
              domain will land on your branded booking page automatically.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
