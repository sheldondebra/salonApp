"use client";

import { useEffect, useState } from "react";
import { CreditCard, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SettingsSaveButton,
  SettingsSectionHeader,
  SettingsToggle,
} from "@/features/settings/settings-ui";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { TenantPaymentConfig } from "@/lib/api/types";

type PaymentSettingsFormProps = {
  tenantSlug: string;
};

export function PaymentSettingsForm({ tenantSlug }: PaymentSettingsFormProps) {
  const [enabled, setEnabled] = useState(false);
  const [depositPercent, setDepositPercent] = useState(30);
  const [requireFull, setRequireFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ settings: { payments?: TenantPaymentConfig } }>(`/${tenantSlug}/settings`)
      .then((res) => {
        const p = res.settings?.payments;
        if (p) {
          setEnabled(Boolean(p.enabled));
          setDepositPercent(p.deposit_percent ?? 30);
          setRequireFull(Boolean(p.require_full_payment));
        }
      })
      .catch(() => toast.error("Could not load payment settings"))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  async function save() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/settings`, {
        payments: {
          enabled,
          deposit_percent: depositPercent,
          require_full_payment: requireFull,
        },
      });
      toast.success("Payment settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  return (
    <Card className="rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={CreditCard}
        title="Online payments"
        description="Accept deposits or full payment on your public booking page via Paystack or Flutterwave."
      />
      <CardContent className="space-y-5 pt-0">
        <SettingsToggle
          label="Enable online payments"
          description="Clients can pay after booking on your public page."
          checked={enabled}
          onChange={setEnabled}
          icon={Wallet}
        />

        <div
          className={`space-y-4 rounded-xl border border-border/60 bg-muted/15 p-4 transition-opacity ${
            enabled ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <div className="max-w-xs space-y-2">
            <Label htmlFor="deposit_percent" className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              Deposit percentage
            </Label>
            <Input
              id="deposit_percent"
              type="number"
              min={1}
              max={100}
              className="rounded-xl"
              value={depositPercent}
              disabled={!enabled || requireFull}
              onChange={(e) => setDepositPercent(Number(e.target.value) || 30)}
            />
            <p className="text-xs text-muted-foreground">
              Share of service price required to hold the slot (e.g. 30%).
            </p>
          </div>

          <SettingsToggle
            label="Require full payment online"
            description="Clients pay the full service total instead of a deposit."
            checked={requireFull}
            disabled={!enabled}
            onChange={setRequireFull}
            icon={CreditCard}
          />
        </div>

        <div className="flex justify-end border-t border-border/60 pt-4">
          <SettingsSaveButton
            saving={saving}
            label="Save payment settings"
            onClick={() => void save()}
          />
        </div>
      </CardContent>
    </Card>
  );
}
