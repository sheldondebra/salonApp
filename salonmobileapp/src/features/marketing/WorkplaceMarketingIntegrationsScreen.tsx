import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { DetailCard, StatusPill, TagList, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, StepFlowCard, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import {
  fetchMarketingIntegrations,
  type MarketingIntegration,
  type MarketingIntegrationsDashboard,
} from "@/workplace/api";

const FALLBACK_DASHBOARD: MarketingIntegrationsDashboard = {
  integrations: [
    {
      provider: "Google Analytics",
      connected: true,
      measurement_id: "G-BEAUTY203",
      consent_mode: true,
      tracked_events: ["booking_started", "booking_completed", "checkout_session"],
      last_event_at: new Date().toISOString(),
    },
    {
      provider: "Meta Pixel",
      connected: true,
      measurement_id: "META-205",
      consent_mode: true,
      tracked_events: ["lead", "booking", "purchase"],
      last_event_at: new Date().toISOString(),
    },
  ],
  recent_events: [
    { name: "booking_started", provider: "Google Analytics", status: "live", deliveries: 42 },
    { name: "booking_completed", provider: "Google Analytics", status: "live", deliveries: 28 },
    { name: "purchase", provider: "Meta Pixel", status: "live", deliveries: 11 },
    { name: "lead", provider: "Meta Pixel", status: "consent-aware", deliveries: 19 },
  ],
};

export function WorkplaceMarketingIntegrationsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [dashboard, setDashboard] = useState<MarketingIntegrationsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setDashboard(await fetchMarketingIntegrations(auth));
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview configuration.` : "Could not load integrations."
      );
      setDashboard(FALLBACK_DASHBOARD);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const connected = useMemo(
    () => dashboard?.integrations.filter((item) => item.connected).length ?? 0,
    [dashboard]
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
        <LoadingState message="Loading marketing integrations…" />
      </ResponsiveShell>
    );
  }

  const integrations = dashboard?.integrations ?? [];

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Marketing integrations"
        subtitle="Google Analytics and Meta Pixel status for booking funnels"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="link-outline" label="Connected" value={String(connected)} />
        <IconStatCard
          icon="analytics-outline"
          label="Event flows"
          value={String(dashboard?.recent_events.length ?? 0)}
        />
        <IconStatCard
          icon="shield-checkmark-outline"
          label="Consent-aware"
          value={String(integrations.filter((item) => item.consent_mode).length)}
        />
        <IconStatCard
          icon="flash-outline"
          label="Tracked events"
          value={String(integrations.reduce((sum, item) => sum + item.tracked_events.length, 0))}
        />
      </IconStatGrid>

      <View style={styles.grid}>
        {integrations.map((integration) => (
          <DetailCard
            key={integration.provider}
            title={integration.provider}
            subtitle={integration.measurement_id || "Pending configuration"}
            style={styles.integrationCard}
          >
            <View style={styles.pillRow}>
              <StatusPill label={integration.connected ? "Connected" : "Needs setup"} tone={integration.connected ? "success" : "warning"} />
              <StatusPill
                label={integration.consent_mode ? "Consent-aware" : "Always on"}
                tone={integration.consent_mode ? "info" : "neutral"}
              />
            </View>
            <SectionTitle title="Tracked events" subtitle="The mobile app shows the events already wired for this provider." />
            <TagList values={integration.tracked_events} />
            <Button
              label={`Test ${integration.provider}`}
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Test placeholder",
                  `${integration.provider} test calls will use the existing webhook-safe event bridge in a follow-up batch.`
                )
              }
            />
          </DetailCard>
        ))}
      </View>

      <StepFlowCard
        title="How teams use this page"
        description="Salon managers can verify IDs, confirm which events are active, and leave the detailed tracking bridge to the web admin panel."
        steps={[
          "Connect the provider in the main Schedelux admin or web dashboard.",
          "Confirm the booking and checkout events listed below are active.",
          "Use the provider test placeholder before launching a campaign.",
        ]}
      />

      <DetailCard
        title="Recent event activity"
        subtitle="A quick operator-friendly feed of what the app is sending most often."
      >
        <View style={part3Styles.stack}>
          {(dashboard?.recent_events ?? []).map((event) => (
            <ListRow
              key={`${event.provider}-${event.name}`}
              icon="pulse-outline"
              title={event.name}
              subtitle={event.provider}
              right={`${event.deliveries} sent`}
            />
          ))}
        </View>
      </DetailCard>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  integrationCard: { gap: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
