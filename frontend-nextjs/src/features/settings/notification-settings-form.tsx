"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  CreditCard,
  Mail,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantSmsLog } from "@/features/notifications/tenant-sms-log";
import { TenantSmsHubCard } from "@/features/sms/tenant-sms-hub-card";
import {
  SettingsGroupLabel,
  SettingsSaveButton,
  SettingsSectionHeader,
  SettingsToggle,
} from "@/features/settings/settings-ui";
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

type NotificationSettingsFormProps = {
  tenantSlug: string;
};

const TOGGLE_GROUPS: {
  title: string;
  icon: typeof Mail;
  items: {
    key: keyof NotificationSettings;
    label: string;
    description?: string;
    channel: "email" | "sms" | "master";
  }[];
}[] = [
  {
    title: "Channels",
    icon: Bell,
    items: [
      {
        key: "email_enabled",
        label: "Email notifications",
        description: "Master switch for all email alerts",
        channel: "master",
      },
      {
        key: "sms_enabled",
        label: "SMS notifications",
        description: "Requires SMS credits above",
        channel: "master",
      },
    ],
  },
  {
    title: "Bookings",
    icon: Calendar,
    items: [
      {
        key: "booking_confirmation_email",
        label: "Booking confirmation",
        description: "Email when a booking is confirmed",
        channel: "email",
      },
      {
        key: "booking_confirmation_sms",
        label: "Booking confirmation",
        description: "SMS when a booking is confirmed",
        channel: "sms",
      },
      {
        key: "booking_reminder_email",
        label: "Appointment reminder",
        description: "Email before the appointment",
        channel: "email",
      },
      {
        key: "booking_reminder_sms",
        label: "Appointment reminder",
        description: "SMS before the appointment",
        channel: "sms",
      },
      {
        key: "booking_cancellation_email",
        label: "Cancellation notice",
        description: "Email when a booking is cancelled",
        channel: "email",
      },
      {
        key: "booking_cancellation_sms",
        label: "Cancellation notice",
        description: "SMS when a booking is cancelled",
        channel: "sms",
      },
    ],
  },
  {
    title: "Payments & marketing",
    icon: CreditCard,
    items: [
      {
        key: "payment_alert_email",
        label: "Payment received",
        description: "Email when a client pays online",
        channel: "email",
      },
      {
        key: "payment_alert_sms",
        label: "Payment received",
        description: "SMS when a client pays online",
        channel: "sms",
      },
      {
        key: "marketing_sms_enabled",
        label: "Marketing SMS",
        description: "Campaign and promotional messages",
        channel: "sms",
      },
    ],
  },
];

export function NotificationSettingsForm({ tenantSlug }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ settings: { notifications?: NotificationSettings } }>(`/${tenantSlug}/settings`)
      .then((res) => {
        if (res.settings?.notifications) {
          setSettings(res.settings.notifications);
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

  function isDisabled(key: keyof NotificationSettings, channel: "email" | "sms" | "master"): boolean {
    if (!settings || channel === "master") return false;
    if (channel === "sms") return !settings.sms_enabled;
    return !settings.email_enabled;
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6">
      <TenantSmsHubCard tenantSlug={tenantSlug} />

      <Card className="rounded-2xl shadow-soft">
        <SettingsSectionHeader
          icon={Bell}
          title="Notification preferences"
          description="Choose which events send email or SMS to your clients."
        />
        <CardContent className="space-y-6 pt-0">
          {TOGGLE_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <SettingsGroupLabel>{group.title}</SettingsGroupLabel>
              <div className="space-y-2">
                {group.items.map(({ key, label, description, channel }) => (
                  <SettingsToggle
                    key={key}
                    label={label}
                    description={description}
                    icon={
                      key === "marketing_sms_enabled"
                        ? Megaphone
                        : channel === "sms"
                          ? MessageSquare
                          : channel === "email"
                            ? Mail
                            : group.icon
                    }
                    checked={settings[key]}
                    disabled={isDisabled(key, channel)}
                    onChange={(v) => update(key, v)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
            <SettingsSaveButton saving={saving} label="Save preferences" onClick={() => void save()} />
          </div>
        </CardContent>
      </Card>

      <TenantSmsLog tenantSlug={tenantSlug} />
    </div>
  );
}
