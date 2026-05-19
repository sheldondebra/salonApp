"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SettingsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant, loading } = useTenant(params.tenantSlug);
  const branding = tenant?.branding;

  if (loading) return <Skeleton className="m-8 h-64 rounded-2xl" />;

  return (
    <WorkplaceShell tenantSlug={params.tenantSlug} tenantName={tenant?.name ?? params.tenantSlug}>
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.settings.manage}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Branding and business profile</p>
        </div>
        <Card className="max-w-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logo, colors, and public booking page details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input defaultValue={tenant?.name} readOnly />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary color</Label>
                <Input defaultValue={branding?.primary_color ?? "#F8BBD0"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Accent color</Label>
                <Input defaultValue={branding?.accent_color ?? "#E879A6"} readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input defaultValue={branding?.tagline ?? ""} readOnly />
            </div>
            <Button onClick={() => toast.info("Branding save API coming in next release")}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      </div>
      </RequirePermission>
    </WorkplaceShell>
  );
}
