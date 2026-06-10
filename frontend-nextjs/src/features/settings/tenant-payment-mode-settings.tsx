"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  SettingsSaveButton,
  SettingsSectionHeader,
  SettingsToggle,
} from "@/features/settings/settings-ui";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type {
  GatewayStatusEntry,
  PaymentGatewayKey,
  SettlementMethod,
  SettlementSchedule,
  TenantPaymentMode,
  TenantPaymentModeSettings,
} from "@/lib/api/types";

type TenantPaymentModeSettingsProps = {
  tenantSlug: string;
};

const MODE_OPTIONS: {
  value: TenantPaymentMode;
  title: string;
  description: string;
  icon: typeof Wallet;
}[] = [
  {
    value: "platform_account",
    title: "Use Schedelux Payments",
    description:
      "Collect MoMo and card payments through Schedelux. Your wallet balance reflects what you have collected on the platform.",
    icon: Wallet,
  },
  {
    value: "tenant_own_account",
    title: "Connect My Own Gateway",
    description:
      "For enterprise salons with their own MTN MoMo merchant or Paystack/Flutterwave accounts. Connection setup comes next.",
    icon: Building2,
  },
  {
    value: "disabled",
    title: "Disable Online Payments",
    description: "Turn off admin-initiated payment requests and online collection for this salon.",
    icon: CreditCard,
  },
];

const GATEWAY_LABELS: Record<PaymentGatewayKey, string> = {
  paystack: "Paystack",
  flutterwave: "Flutterwave",
  mtn_momo: "MTN MoMo",
};

function gatewayBadgeVariant(status: GatewayStatusEntry["status"]) {
  switch (status) {
    case "platform":
      return "success" as const;
    case "pending_setup":
      return "warning" as const;
    case "unavailable":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function gatewayStatusLabel(status: GatewayStatusEntry["status"]): string {
  switch (status) {
    case "platform":
      return "Via Schedelux";
    case "pending_setup":
      return "Setup pending";
    case "unavailable":
      return "Unavailable";
    case "disabled":
      return "Off";
    default:
      return "Enabled";
  }
}

export function TenantPaymentModeSettings({ tenantSlug }: TenantPaymentModeSettingsProps) {
  const [settings, setSettings] = useState<TenantPaymentModeSettings | null>(null);
  const [mode, setMode] = useState<TenantPaymentMode>("platform_account");
  const [defaultGateway, setDefaultGateway] = useState<PaymentGatewayKey>("paystack");
  const [collectionEnabled, setCollectionEnabled] = useState(true);
  const [mtnEnabled, setMtnEnabled] = useState(true);
  const [paystackEnabled, setPaystackEnabled] = useState(true);
  const [flutterwaveEnabled, setFlutterwaveEnabled] = useState(true);
  const [schedule, setSchedule] = useState<SettlementSchedule>("manual");
  const [settlementMethod, setSettlementMethod] = useState<SettlementMethod | "">("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: TenantPaymentModeSettings }>(`/${tenantSlug}/payment-settings`)
      .then((res) => {
        const s = res.data;
        setSettings(s);
        setMode(s.mode);
        setDefaultGateway(s.default_gateway);
        setCollectionEnabled(s.is_payment_enabled);
        setMtnEnabled(s.mtn_momo_enabled);
        setPaystackEnabled(s.paystack_enabled);
        setFlutterwaveEnabled(s.flutterwave_enabled);
        setSchedule(s.settlement_schedule);
        setSettlementMethod(s.settlement_method ?? "");
        setAccountName(s.settlement_account_name ?? "");
        setAccountNumber(s.settlement_account_number ?? "");
        setProvider(s.settlement_provider ?? "");
        setNotes(s.settlement_notes ?? "");
      })
      .catch(() => toast.error("Could not load payment mode settings"))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  async function save() {
    setSaving(true);
    try {
      const res = await createApiClient(getApiClientOptions()).patch<{ data: TenantPaymentModeSettings }>(
        `/${tenantSlug}/payment-settings`,
        {
          mode,
          default_gateway: defaultGateway,
          is_payment_enabled: mode === "disabled" ? false : collectionEnabled,
          mtn_momo_enabled: mtnEnabled,
          paystack_enabled: paystackEnabled,
          flutterwave_enabled: flutterwaveEnabled,
          settlement_schedule: schedule,
          settlement_method: settlementMethod || null,
          settlement_account_name: accountName || null,
          settlement_account_number: accountNumber || null,
          settlement_provider: provider || null,
          settlement_notes: notes || null,
        }
      );
      setSettings(res.data);
      toast.success("Payment mode settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const gatewayStatus = settings?.gateway_status;

  return (
    <Card className="rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={Smartphone}
        title="Payment mode & settlement"
        description="How your salon collects MoMo and online payments, and where payouts are sent."
      />
      <CardContent className="space-y-6 pt-0">
        <div className="grid gap-3 sm:grid-cols-1">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setMode(opt.value);
                  if (opt.value === "disabled") setCollectionEnabled(false);
                  else if (!collectionEnabled) setCollectionEnabled(true);
                }}
                className={cn(
                  "flex w-full gap-3 rounded-xl border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-muted/10 hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{opt.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {mode === "tenant_own_account" ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
            Your own gateway connection will be configured in a later step. General Office may need to approve
            enterprise MTN accounts.
          </p>
        ) : null}

        {mode !== "disabled" ? (
          <SettingsToggle
            label="Enable payment collection"
            description="Allow staff to send MoMo payment requests and collect online."
            checked={collectionEnabled}
            onChange={setCollectionEnabled}
            icon={Zap}
          />
        ) : null}

        {gatewayStatus ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gateway status</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GATEWAY_LABELS) as PaymentGatewayKey[]).map((key) => {
                const entry = gatewayStatus[key];
                if (!entry) return null;
                return (
                  <Badge key={key} variant={gatewayBadgeVariant(entry.status)} className="gap-1.5">
                    {GATEWAY_LABELS[key]}
                    <span className="font-normal opacity-80">· {gatewayStatusLabel(entry.status)}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        ) : null}

        {mode !== "disabled" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default gateway</Label>
              <Select value={defaultGateway} onValueChange={(v) => setDefaultGateway(v as PaymentGatewayKey)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paystackEnabled ? <SelectItem value="paystack">Paystack</SelectItem> : null}
                  {flutterwaveEnabled ? <SelectItem value="flutterwave">Flutterwave</SelectItem> : null}
                  {mtnEnabled ? <SelectItem value="mtn_momo">MTN MoMo</SelectItem> : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enabled gateways</p>
              <SettingsToggle label="MTN MoMo" checked={mtnEnabled} onChange={setMtnEnabled} icon={Smartphone} />
              <SettingsToggle label="Paystack" checked={paystackEnabled} onChange={setPaystackEnabled} icon={CreditCard} />
              <SettingsToggle
                label="Flutterwave"
                checked={flutterwaveEnabled}
                onChange={setFlutterwaveEnabled}
                icon={CreditCard}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/15 p-4">
          <SettingsSectionHeader
            icon={Landmark}
            title="Settlement details"
            description="Where Schedelux should send your available balance when you request a payout."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payout schedule</Label>
              <Select value={schedule} onValueChange={(v) => setSchedule(v as SettlementSchedule)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (on request)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Settlement method</Label>
              <Select
                value={settlementMethod || "none"}
                onValueChange={(v) => setSettlementMethod(v === "none" ? "" : (v as SettlementMethod))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settlement_account_name">Account name</Label>
              <Input
                id="settlement_account_name"
                className="rounded-xl"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settlement_account_number">Account / MoMo number</Label>
              <Input
                id="settlement_account_number"
                className="rounded-xl"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settlement_provider">Provider / bank</Label>
              <Input
                id="settlement_provider"
                className="rounded-xl"
                placeholder="e.g. MTN, Ecobank"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settlement_notes">Notes</Label>
              <Input
                id="settlement_notes"
                className="rounded-xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border/60 pt-4">
          <SettingsSaveButton saving={saving} label="Save payment mode" onClick={() => void save()} />
        </div>
      </CardContent>
    </Card>
  );
}
