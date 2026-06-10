"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, KeyRound, Plug, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PaymentProviderAccountPayload } from "@/lib/api/types";
import { PaymentGatewayConnectedPanel } from "@/features/payments/payment-gateway-connected-panel";
import type { PlatformPaymentGateway } from "@/lib/api/types";

function statusBadge(status: string) {
  switch (status) {
    case "connected":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function accountToGateway(account: PaymentProviderAccountPayload): PlatformPaymentGateway {
  return {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    description: "Platform collection account for Request to Pay and tenant wallet top-ups.",
    configured: account.configured,
    connected: account.status === "connected",
    status: account.status,
    key_source: account.key_source,
    environment: account.environment,
    country: account.country,
    currency: account.currency,
    target_environment: account.target_environment,
    callback_host: account.callback_host,
    public_key_masked: account.api_user_masked,
    secret_key_masked: account.api_key_masked,
    subscription_key_masked: account.subscription_key_masked,
    last_health_check_at: account.last_health_check_at,
    last_successful_token_at: account.last_successful_token_at,
    last_error: account.last_error,
    updated_at: account.updated_at,
    supports_health_check: true,
    account,
  };
}

type AdminMtnMomoSettingsProps = {
  embedded?: boolean;
  onAccountChange?: (account: PaymentProviderAccountPayload) => void;
};

export function AdminMtnMomoSettings({ embedded = false, onAccountChange }: AdminMtnMomoSettingsProps) {
  const [account, setAccount] = useState<PaymentProviderAccountPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [replaceSecrets, setReplaceSecrets] = useState(false);

  const [environment, setEnvironment] = useState("sandbox");
  const [country, setCountry] = useState("GH");
  const [currency, setCurrency] = useState("GHS");
  const [targetEnvironment, setTargetEnvironment] = useState("sandbox");
  const [callbackHost, setCallbackHost] = useState("");
  const [apiUser, setApiUser] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [subscriptionKey, setSubscriptionKey] = useState("");

  const applyAccount = useCallback(
    (data: PaymentProviderAccountPayload) => {
      setAccount(data);
      setEnvironment(data.environment);
      setCountry(data.country);
      setCurrency(data.currency);
      setTargetEnvironment(data.target_environment ?? "sandbox");
      setCallbackHost(data.callback_host ?? "");
      onAccountChange?.(data);
    },
    [onAccountChange]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: PaymentProviderAccountPayload }>(
        "/admin/payment-providers/mtn-momo"
      );
      applyAccount(res.data);
      if (!res.data.has_stored_api_key && !res.data.configured) {
        setReplaceSecrets(true);
      }
    } catch {
      toast.error("Could not load platform MTN MoMo settings");
    } finally {
      setLoading(false);
    }
  }, [applyAccount]);

  useEffect(() => {
    void load();
  }, [load]);

  const secretsLocked =
    Boolean(account?.has_stored_api_key || account?.has_stored_api_user) && !replaceSecrets;

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        environment,
        country: country.trim(),
        currency: currency.trim().toUpperCase(),
        target_environment: targetEnvironment.trim(),
        callback_host: callbackHost.trim(),
      };
      if (replaceSecrets) {
        if (apiUser.trim()) body.api_user = apiUser.trim();
        if (apiKey.trim()) body.api_key = apiKey.trim();
        if (subscriptionKey.trim()) body.subscription_key = subscriptionKey.trim();
      }

      const res = await createApiClient(getApiClientOptions()).patch<{
        data: PaymentProviderAccountPayload;
        message: string;
      }>("/admin/payment-providers/mtn-momo", body);

      toast.success(res.message);
      applyAccount(res.data);
      setApiUser("");
      setApiKey("");
      setSubscriptionKey("");
      setReplaceSecrets(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function runHealthCheck() {
    setChecking(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        ok: boolean;
        message: string;
        account: PaymentProviderAccountPayload;
      }>("/admin/payment-providers/mtn-momo/health-check");
      applyAccount(res.account);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <Skeleton className={embedded ? "h-64 rounded-xl" : "h-72 rounded-2xl"} />;
  }

  const gatewayView = account ? accountToGateway(account) : null;

  const formBody = (
    <div className="space-y-5">
      {gatewayView && !embedded ? (
        <PaymentGatewayConnectedPanel gateway={gatewayView} />
      ) : null}

      {account?.last_error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {account.last_error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
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
          <Label>Country</Label>
          <Input className="rounded-xl" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            className="rounded-xl"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Target environment</Label>
          <Input
            className="rounded-xl"
            value={targetEnvironment}
            onChange={(e) => setTargetEnvironment(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Callback host</Label>
          <Input
            className="rounded-xl"
            value={callbackHost}
            onChange={(e) => setCallbackHost(e.target.value)}
            placeholder="https://api.beautyos.app"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">API credentials</p>
          </div>
          {secretsLocked ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setReplaceSecrets(true)}>
              Replace secrets
            </Button>
          ) : null}
        </div>

        {secretsLocked ? (
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p>API user: {account?.api_user_masked ?? "—"}</p>
            <p>API key: {account?.api_key_masked ?? "—"}</p>
            <p>Subscription key: {account?.subscription_key_masked ?? "—"}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>API user</Label>
              <Input className="rounded-xl" value={apiUser} onChange={(e) => setApiUser(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>API key</Label>
              <Input
                className="rounded-xl"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription key</Label>
              <Input
                className="rounded-xl"
                type="password"
                value={subscriptionKey}
                onChange={(e) => setSubscriptionKey(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={saving}>
          <Plug className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save MTN settings"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void runHealthCheck()} disabled={checking}>
          <Activity className="mr-2 h-4 w-4" />
          {checking ? "Verifying…" : "Verify connection"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle>Platform MTN MoMo</CardTitle>
              <CardDescription>Schedelux collection account used by most tenants.</CardDescription>
            </div>
          </div>
          {account ? (
            <div className="flex flex-wrap items-center gap-2">
              {account.status === "connected" ? (
                <Badge className="gap-1 rounded-full bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant={statusBadge(account.status)} className="capitalize">
                  {account.status.replace(/_/g, " ")}
                </Badge>
              )}
              {account.key_source === "environment" ? (
                <Badge variant="outline" className="rounded-full text-xs">
                  Key from .env
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}
