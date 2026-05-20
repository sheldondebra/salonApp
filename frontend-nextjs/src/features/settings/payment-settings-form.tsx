"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          Online payments
        </CardTitle>
        <CardDescription>
          Accept booking deposits or full payment via Paystack and Flutterwave on your public booking page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>
                <span className="font-medium">Enable online payments</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Clients can pay after booking on your public page.
                </span>
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deposit_percent">Deposit %</Label>
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
                  Used when full payment is not required (e.g. 30% to hold the slot).
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={requireFull}
                disabled={!enabled}
                onChange={(e) => setRequireFull(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>
                <span className="font-medium">Require full payment online</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Clients pay the full service total instead of a deposit.
                </span>
              </span>
            </label>

            <Button className="rounded-xl" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save payment settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
