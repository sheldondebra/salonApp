import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, StepFlowCard, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchAbandonedBookings,
  type AbandonedBookingRecord,
  type AbandonedBookingsDashboard,
} from "@/workplace/api";

const FALLBACK_DASHBOARD: AbandonedBookingsDashboard = {
  summary: {
    open_sessions: 18,
    recovered_count: 7,
    recovered_value_cents: 214000,
    automations_live: 3,
  },
  automation: {
    sms: true,
    email: true,
    whatsapp: false,
    delay_minutes: 45,
  },
  sessions: [
    {
      id: 1,
      client_name: "Ama K.",
      service_name: "Silk press",
      channel: "Instagram link",
      started_at: new Date().toISOString(),
      reminder_state: "due now",
      recovery_value_cents: 38000,
      status: "open",
    },
    {
      id: 2,
      client_name: "Linda O.",
      service_name: "Gel refill",
      channel: "TikTok bio",
      started_at: new Date().toISOString(),
      reminder_state: "sms sent",
      recovery_value_cents: 22000,
      status: "recovering",
    },
    {
      id: 3,
      client_name: "Ruth M.",
      service_name: "Highlights",
      channel: "Website",
      started_at: new Date().toISOString(),
      reminder_state: "recovered",
      recovery_value_cents: 54000,
      status: "recovered",
    },
  ],
};

export function WorkplaceAbandonedBookingsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [dashboard, setDashboard] = useState<AbandonedBookingsDashboard | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const next = await fetchAbandonedBookings(auth);
      setDashboard(next);
      setSelectedId((current) => current ?? next.sessions[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing recovery preview.` : "Could not load abandoned bookings."
      );
      setDashboard(FALLBACK_DASHBOARD);
      setSelectedId((current) => current ?? FALLBACK_DASHBOARD.sessions[0]?.id ?? null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const sessions = dashboard?.sessions ?? [];
  const selected = useMemo<AbandonedBookingRecord | null>(
    () => sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null,
    [sessions, selectedId]
  );

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading abandoned bookings…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Open sessions" subtitle="Follow incomplete booking journeys before they cool down." />
      {sessions.map((session) => {
        const isSelected = session.id === selected?.id;
        return (
          <Pressable
            key={session.id}
            onPress={() => setSelectedId(session.id)}
            style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{session.client_name}</Text>
            <Text style={part3Styles.cardMeta}>{session.service_name}</Text>
            <Text style={part3Styles.cardMeta}>
              {session.channel} · {formatMoney(session.recovery_value_cents)}
            </Text>
            <StatusPill
              label={session.reminder_state}
              tone={session.status === "recovered" ? "success" : session.status === "recovering" ? "info" : "warning"}
            />
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selected?.client_name ?? "Select a session"}
        subtitle={selected ? `${selected.service_name} · ${selected.channel}` : "Choose a recovery lead from the list."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="time-outline"
              title="Recovery state"
              subtitle="Current automation step for the client journey"
              right={selected.reminder_state}
            />
            <ListRow
              icon="cash-outline"
              title="Potential revenue"
              subtitle="Projected booking value if the session converts"
              right={formatMoney(selected.recovery_value_cents)}
            />
            <Button
              label="Trigger reminder"
              onPress={() =>
                Alert.alert(
                  "Reminder placeholder",
                  "Recovery reminders will call the SMS, email, and WhatsApp providers from the marketing automation bridge."
                )
              }
            />
          </View>
        ) : (
          <EmptyState title="No session selected" description="Tap a lead to preview recovery actions." />
        )}
      </DetailCard>

      <StepFlowCard
        title="Recovery automation"
        description="Phone-friendly summary of how the salon is following up on abandoned bookings."
        steps={[
          `Wait ${dashboard?.automation.delay_minutes ?? 0} minutes after a client drops out.`,
          "Send a channel-specific reminder with their chosen service and preferred time.",
          "Track whether the client re-enters the booking flow or finishes a new appointment.",
        ]}
      >
        <View style={styles.pillRow}>
          <StatusPill label={`SMS ${dashboard?.automation.sms ? "on" : "off"}`} tone={dashboard?.automation.sms ? "success" : "neutral"} />
          <StatusPill label={`Email ${dashboard?.automation.email ? "on" : "off"}`} tone={dashboard?.automation.email ? "success" : "neutral"} />
          <StatusPill label={`WhatsApp ${dashboard?.automation.whatsapp ? "on" : "off"}`} tone={dashboard?.automation.whatsapp ? "success" : "neutral"} />
        </View>
      </StepFlowCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Abandoned bookings"
        subtitle="Recovery queue and automation status"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard
          icon="warning-outline"
          label="Open sessions"
          value={String(dashboard?.summary.open_sessions ?? 0)}
        />
        <IconStatCard
          icon="refresh-outline"
          label="Recovered"
          value={String(dashboard?.summary.recovered_count ?? 0)}
        />
        <IconStatCard
          icon="cash-outline"
          label="Recovered value"
          value={formatMoney(dashboard?.summary.recovered_value_cents ?? 0)}
        />
        <IconStatCard
          icon="git-network-outline"
          label="Automations"
          value={String(dashboard?.summary.automations_live ?? 0)}
        />
      </IconStatGrid>
      {useSplitLayout ? (
        <View style={sharedStyles.split}>
          {listPane}
          {detailPane}
        </View>
      ) : (
        <>
          {listPane}
          {detailPane}
        </>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
