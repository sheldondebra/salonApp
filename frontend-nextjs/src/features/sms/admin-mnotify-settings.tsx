"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, MessageSquare, Plug, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

export type MnotifySettings = {
  provider: string;
  sender_id: string;
  base_url: string;
  balance_url: string;
  api_configured: boolean;
  has_stored_key: boolean;
  key_source: "database" | "environment" | null;
  api_key_masked: string | null;
  connected: boolean;
  status: string;
  balance_credits: number;
  last_synced_at: string | null;
  verified_at: string | null;
  last_error: string | null;
};

type AdminMnotifySettingsProps = {
  onSettingsChange?: (settings: MnotifySettings) => void;
  onBalanceSynced?: () => void;
};

export function AdminMnotifySettings({ onSettingsChange, onBalanceSynced }: AdminMnotifySettingsProps) {
  const [settings, setSettings] = useState<MnotifySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [replaceKey, setReplaceKey] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const [senderId, setSenderId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [balanceUrl, setBalanceUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const applySettings = useCallback(
    (s: MnotifySettings) => {
      setSettings(s);
      setSenderId(s.sender_id ?? "");
      setBaseUrl(s.base_url ?? "");
      setBalanceUrl(s.balance_url ?? "");
      onSettingsChange?.(s);
    },
    [onSettingsChange]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<MnotifySettings>(
        "/admin/sms-reseller/provider/settings"
      );
      applySettings(res);
      if (!res.has_stored_key && !res.api_configured) {
        setReplaceKey(true);
      }
    } catch {
      toast.error("Could not load MNotify settings");
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    void load();
  }, [load]);

  const keyLocked = Boolean(settings?.has_stored_key) && !replaceKey;

  async function saveSettings() {
    if (replaceKey && !apiKey.trim()) {
      toast.error("Enter the new API key");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        sender_id: senderId.trim(),
        base_url: baseUrl.trim(),
        balance_url: balanceUrl.trim(),
      };
      if (replaceKey && apiKey.trim()) {
        body.api_key = apiKey.trim();
      }

      const res = await createApiClient(getApiClientOptions()).patch<{
        message: string;
        settings: MnotifySettings;
      }>("/admin/sms-reseller/provider/settings", body);

      toast.success(res.message);
      applySettings(res.settings);
      setApiKey("");
      setReplaceKey(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        ok: boolean;
        message: string;
        balance_preview: number | null;
        settings: MnotifySettings;
      }>("/admin/sms-reseller/provider/test");

      applySettings(res.settings);
      if (res.ok) {
        toast.success(
          res.balance_preview !== null
            ? `${res.message} Balance: ${res.balance_preview} credits.`
            : res.message
        );
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function sendTestSms() {
    if (!testPhone.trim()) {
      toast.error("Enter a phone number for the test SMS");
      return;
    }
    setSendingTest(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        ok: boolean;
        message: string;
      }>("/admin/sms-reseller/provider/test-sms", {
        phone: testPhone.trim(),
        message: testMessage.trim() || undefined,
      });
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Test SMS failed");
    } finally {
      setSendingTest(false);
    }
  }

  async function reloadBalance() {
    setSyncing(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        provider: MnotifySettings;
        sync: { status: string; message: string };
      }>("/admin/sms-reseller/provider/sync");

      applySettings(res.provider);
      if (res.sync.status === "success") {
        toast.success(res.sync.message);
        onBalanceSynced?.();
      } else {
        toast.error(res.sync.message);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Balance sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  return (
    <Card className="rounded-2xl border-primary/20 shadow-soft">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            MNotify connection
          </CardTitle>
          <CardDescription>
            Configure the master MNotify account for the SMS reseller hub. Keys are encrypted at rest and never
            shown in full after saving.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {settings?.connected ? (
            <Badge className="gap-1 rounded-full bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : settings?.api_configured ? (
            <Badge variant="outline" className="rounded-full border-amber-300 text-amber-800">
              Configured — test connection
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full">
              Not configured
            </Badge>
          )}
          {settings?.key_source === "environment" ? (
            <Badge variant="outline" className="rounded-full text-xs">
              Key from .env
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5" />
              API key
            </Label>
            {keyLocked ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Input
                  className="rounded-xl font-mono text-sm flex-1 min-w-[12rem]"
                  value={settings?.api_key_masked ?? "••••••••••••"}
                  disabled
                  readOnly
                />
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setReplaceKey(true)}>
                  Replace key
                </Button>
              </div>
            ) : (
              <Input
                className="mt-1 rounded-xl font-mono text-sm"
                type="password"
                autoComplete="off"
                placeholder="Paste MNotify API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {keyLocked
                ? "API key is saved. Use Replace key to enter a new one."
                : "Required for live SMS. Save settings after entering the key."}
            </p>
          </div>

          <div>
            <Label>Sender ID</Label>
            <Input
              className="mt-1 rounded-xl"
              maxLength={11}
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="Schedelux"
            />
          </div>

          <div>
            <Label>Balance API URL</Label>
            <Input
              className="mt-1 rounded-xl font-mono text-xs"
              value={balanceUrl}
              onChange={(e) => setBalanceUrl(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Send API base URL</Label>
            <Input
              className="mt-1 rounded-xl font-mono text-xs"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        </div>

        {settings?.last_error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {settings.last_error}
          </p>
        ) : null}

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Send test SMS
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Phone (E.164 or local)</Label>
              <Input
                className="mt-1 rounded-xl"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="233XXXXXXXXX"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Message (optional)</Label>
              <Input
                className="mt-1 rounded-xl"
                maxLength={160}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Schedelux test SMS…"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={sendingTest || !settings?.api_configured}
            onClick={() => void sendTestSms()}
          >
            {sendingTest ? "Sending…" : "Send test SMS"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void saveSettings()}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={testing || !settings?.api_configured}
            onClick={() => void testConnection()}
          >
            <Plug className={`h-4 w-4 ${testing ? "animate-pulse" : ""}`} />
            {testing ? "Testing…" : "Test connection"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={syncing || !settings?.api_configured}
            onClick={() => void reloadBalance()}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Reloading…" : "Reload SMS balance"}
          </Button>
        </div>

        {settings?.last_synced_at ? (
          <p className="text-xs text-muted-foreground">
            Last balance sync: {new Date(settings.last_synced_at).toLocaleString()}
            {settings.balance_credits !== undefined ? ` · ${settings.balance_credits} credits` : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
