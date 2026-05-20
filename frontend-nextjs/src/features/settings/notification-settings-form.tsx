"use client";

import { useEffect, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantSmsLog } from "@/features/notifications/tenant-sms-log";
import { TenantSmsWalletCard } from "@/features/sms/tenant-sms-wallet-card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

export type NotificationSettings = {
  email_enabled: boolean;
  sms_enabled: boolean;
  booking_confirmation_email: boolean;
  booking_confirmation_sms: boolean;
  booking_reminder_email: boolean;
  booking_reminder_sms: boolean;
  booking_cancellation_email: boolean;
  booking_cancellation_sms: boolean;
  payment_alert_email: boolean;
  payment_alert_sms: boolean;
  marketing_sms_enabled: boolean;
};

type SmsUsage = {
  period: string;
  sent: number;
  failed: number;
};

type NotificationSettingsFormProps = {
  tenantSlug: string;
};

const TOGGLES: {
  key: keyof NotificationSettings;
  label: string;
  group: "channel" | "booking" | "payment" | "marketing";
}[] = [
  { key: "email_enabled", label: "Email notifications", group: "channel" },
  { key: "sms_enabled", label: "SMS notifications (MNotify)", group: "channel" },
  { key: "booking_confirmation_email", label: "Booking confirmation — email", group: "booking" },
  { key: "booking_confirmation_sms", label: "Booking confirmation — SMS", group: "booking" },
  { key: "booking_reminder_email", label: "Appointment reminder — email", group: "booking" },
  { key: "booking_reminder_sms", label: "Appointment reminder — SMS", group: "booking" },
  { key: "booking_cancellation_email", label: "Cancellation notice — email", group: "booking" },
  { key: "booking_cancellation_sms", label: "Cancellation notice — SMS", group: "booking" },
  { key: "payment_alert_email", label: "Payment received — email", group: "payment" },
  { key: "payment_alert_sms", label: "Payment received — SMS", group: "payment" },
  { key: "marketing_sms_enabled", label: "Marketing SMS (campaign foundation)", group: "marketing" },
];

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-input accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function NotificationSettingsForm({ tenantSlug }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [smsUsage, setSmsUsage] = useState<SmsUsage | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{
        settings: { notifications?: NotificationSettings; sms_usage?: SmsUsage };
      }>(`/${tenantSlug}/settings`)
      .then((res) => {
        if (res.settings?.notifications) {
          setSettings(res.settings.notifications);
        }
        if (res.settings?.sms_usage) {
          setSmsUsage(res.settings.sms_usage);
        }
      })
      .catch(() => toast.error("Could not load notification settings"))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/settings`, {
        notifications: settings,
      });
      toast.success("Notification settings saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof NotificationSettings, value: boolean) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (loading) {
    return <Skeleton className="h-64 max-w-3xl rounded-2xl" />;
  }

  if (!settings) {
    return null;
  }

  const smsOff = !settings.sms_enabled;
  const emailOff = !settings.email_enabled;

  return (
    <>
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription>
          Control SMS (MNotify) and email alerts for bookings, reminders, and payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {smsUsage ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4" />
              SMS usage — {smsUsage.period}
            </p>
            <p className="mt-1 text-muted-foreground">
              {smsUsage.sent} sent · {smsUsage.failed} failed this month
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          {TOGGLES.map(({ key, label, group }) => {
            const disabled =
              (group !== "channel" && group !== "marketing" && key.endsWith("_sms") && smsOff) ||
              (group !== "channel" && key.endsWith("_email") && emailOff) ||
              (group === "marketing" && smsOff);

            return (
              <ToggleRow
                key={key}
                label={label}
                checked={settings[key]}
                disabled={disabled}
                onChange={(v) => update(key, v)}
              />
            );
          })}
        </div>

        <Button onClick={save} disabled={saving} className="rounded-xl">
          {saving ? "Saving…" : "Save notifications"}
        </Button>
      </CardContent>
    </Card>
    <TenantSmsWalletCard tenantSlug={tenantSlug} />
    <TenantSmsLog tenantSlug={tenantSlug} />
    </>
  );
}
