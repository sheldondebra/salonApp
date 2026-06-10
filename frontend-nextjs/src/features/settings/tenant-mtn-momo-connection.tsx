"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, KeyRound, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSectionHeader } from "@/features/settings/settings-ui";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PaymentProviderAccountPayload, TenantMtnMomoContext } from "@/lib/api/types";

type TenantMtnMomoConnectionProps = {
  tenantSlug: string;
};

function statusVariant(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "pending") return "warning" as const;
  return "secondary" as const;
}

export function TenantMtnMomoConnection({ tenantSlug }: TenantMtnMomoConnectionProps) {
  const [ctx, setCtx] = useState<TenantMtnMomoContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [replaceSecrets, setReplaceSecrets] = useState(false);
  const [environment, setEnvironment] = useState("sandbox");
  const [targetEnvironment, setTargetEnvironment] = useState("sandbox");
  const [callbackHost, setCallbackHost] = useState("");
  const [apiUser, setApiUser] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [subscriptionKey, setSubscriptionKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: TenantMtnMomoContext }>(
        `/${tenantSlug}/payment-providers/mtn-momo`
      );
      setCtx(res.data);
      const own = res.data.tenant_account;
      if (own) {
        setEnvironment(own.environment);
        setTargetEnvironment(own.target_environment ?? "sandbox");
        setCallbackHost(own.callback_host ?? "");
      }
    } catch {
      toast.error("Could not load MTN MoMo connection");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function requestConnection() {
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        data: PaymentProviderAccountPayload;
        message: string;
      }>(`/${tenantSlug}/payment-providers/mtn-momo/request-connection`);
      toast.success(res.message);
      setReplaceSecrets(true);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not request connection");
    }
  }

  async function saveOwnAccount() {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        environment,
        target_environment: targetEnvironment.trim(),
        callback_host: callbackHost.trim(),
      };
      if (replaceSecrets) {
        if (apiUser.trim()) body.api_user = apiUser.trim();
        if (apiKey.trim()) body.api_key = apiKey.trim();
        if (subscriptionKey.trim()) body.subscription_key = subscriptionKey.trim();
      }
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/payment-providers/mtn-momo`, body);
      toast.success("Tenant MTN settings saved");
      setReplaceSecrets(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function healthCheck() {
    setChecking(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        ok: boolean;
        message: string;
      }>(`/${tenantSlug}/payment-providers/mtn-momo/health-check`);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  }

  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!ctx) return null;

  const platform = ctx.platform_account;
  const own = ctx.tenant_account;
  const secretsLocked = Boolean(own?.has_stored_api_key) && !replaceSecrets;

  return (
    <Card className="rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={Smartphone}
        title="MTN MoMo connection"
        description={
          ctx.uses_platform_account
            ? "Your salon collects through the Schedelux platform MTN account."
            : "Connect your own MTN MoMo merchant credentials."
        }
      />
      <CardContent className="space-y-4 pt-0">
        {ctx.uses_platform_account ? (
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(platform.status)} className="capitalize">
                Platform · {platform.status.replace(/_/g, " ")}
              </Badge>
              <span className="text-muted-foreground capitalize">{platform.environment}</span>
              <span className="text-muted-foreground">
                {platform.country} · {platform.currency}
              </span>
            </div>
            <p className="text-muted-foreground">
              Payments are collected via Schedelux. Your wallet balance reflects what you collect on the platform — not
              your personal MoMo balance.
            </p>
            {platform.last_error ? <p className="mt-2 text-destructive">{platform.last_error}</p> : null}
          </div>
        ) : null}

        {ctx.can_manage_own_account ? (
          <>
            {!own || own.status === "not_configured" ? (
              <Button type="button" variant="secondary" onClick={() => void requestConnection()}>
                Request MTN connection
              </Button>
            ) : null}

            {own ? (
              <div className="space-y-4 rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(own.status)} className="capitalize">
                    {own.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">{own.environment}</span>
                </div>
                {own.last_error ? <p className="text-sm text-destructive">{own.last_error}</p> : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={environment} onValueChange={setEnvironment}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target environment</Label>
                    <Input value={targetEnvironment} onChange={(e) => setTargetEnvironment(e.target.value)} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Callback host</Label>
                  <Input value={callbackHost} onChange={(e) => setCallbackHost(e.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-2 rounded-lg bg-muted/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      <span className="text-sm font-medium">Merchant credentials</span>
                    </div>
                    {secretsLocked ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setReplaceSecrets(true)}>
                        Replace
                      </Button>
                    ) : null}
                  </div>
                  {secretsLocked ? (
                    <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                      <span>User: {own.api_user_masked ?? "—"}</span>
                      <span>Key: {own.api_key_masked ?? "—"}</span>
                      <span>Sub key: {own.subscription_key_masked ?? "—"}</span>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input placeholder="API user" value={apiUser} onChange={(e) => setApiUser(e.target.value)} className="rounded-xl" />
                      <Input placeholder="API key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="rounded-xl" />
                      <Input placeholder="Subscription key" type="password" value={subscriptionKey} onChange={(e) => setSubscriptionKey(e.target.value)} className="rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void saveOwnAccount()} disabled={saving}>
                    {saving ? "Saving…" : "Save MTN credentials"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void healthCheck()} disabled={checking}>
                    <Activity className="mr-2 h-4 w-4" />
                    {checking ? "Checking…" : "Health check"}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {ctx.payment_mode === "disabled" ? (
          <p className="text-sm text-muted-foreground">Online payments are disabled for this salon.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
