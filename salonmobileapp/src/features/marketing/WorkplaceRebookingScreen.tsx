import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
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
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchRebookingDashboard,
  type RebookingDashboard,
  type RebookingSuggestion,
} from "@/workplace/api";

const FALLBACK_DASHBOARD: RebookingDashboard = {
  summary: {
    due_this_week: 14,
    rules: 4,
    scheduled_reminders: 9,
    recovered_clients: 22,
  },
  rules: [
    { id: 1, label: "Braids follow-up", cadence_days: 28, scope: "Service", active: true },
    { id: 2, label: "Gel refill reminder", cadence_days: 21, scope: "Service", active: true },
    { id: 3, label: "Color touch-up", cadence_days: 42, scope: "Staff", active: true },
  ],
  suggestions: [
    {
      id: 1,
      client_name: "Faith O.",
      service_name: "Braids removal + retouch",
      due_on: new Date().toISOString(),
      staff_name: "Mabel",
      confidence: "high",
      channel: "SMS",
    },
    {
      id: 2,
      client_name: "Janet N.",
      service_name: "Gel refill",
      due_on: new Date().toISOString(),
      staff_name: "Dora",
      confidence: "medium",
      channel: "Push",
    },
  ],
};

export function WorkplaceRebookingScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [dashboard, setDashboard] = useState<RebookingDashboard | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const next = await fetchRebookingDashboard(auth);
      setDashboard(next);
      setSelectedId((current) => current ?? next.suggestions[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview suggestions.` : "Could not load rebooking prompts."
      );
      setDashboard(FALLBACK_DASHBOARD);
      setSelectedId((current) => current ?? FALLBACK_DASHBOARD.suggestions[0]?.id ?? null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const suggestions = dashboard?.suggestions ?? [];
  const selected = useMemo<RebookingSuggestion | null>(
    () => suggestions.find((item) => item.id === selectedId) ?? suggestions[0] ?? null,
    [suggestions, selectedId]
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
        <LoadingState message="Loading rebooking prompts…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Due clients" subtitle="Clients who are likely ready for their next visit." />
      {suggestions.map((suggestion) => {
        const isSelected = suggestion.id === selected?.id;
        return (
          <Pressable
            key={suggestion.id}
            onPress={() => setSelectedId(suggestion.id)}
            style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{suggestion.client_name}</Text>
            <Text style={part3Styles.cardMeta}>{suggestion.service_name}</Text>
            <View style={styles.pillRow}>
              <StatusPill label={suggestion.confidence} tone={suggestion.confidence === "high" ? "success" : "info"} />
              <StatusPill label={suggestion.channel} tone="neutral" />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selected?.client_name ?? "Select a client"}
        subtitle={selected ? `${selected.service_name} with ${selected.staff_name || "assigned staff"}` : "Choose a client from the rebooking list."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="calendar-outline"
              title="Recommended date"
              subtitle="The next suggested touchpoint based on service cadence"
              right={selected.due_on ? new Date(selected.due_on).toLocaleDateString() : "Due now"}
            />
            <ListRow
              icon="chatbubble-ellipses-outline"
              title="Preferred channel"
              subtitle="Rebooking prompt channel for this client"
              right={selected.channel}
            />
            <Button
              label="Send rebooking prompt"
              onPress={() =>
                Alert.alert(
                  "Prompt placeholder",
                  "Rebooking reminders will send from the campaign automation service after the API is connected."
                )
              }
            />
          </View>
        ) : (
          <EmptyState title="No client selected" description="Tap a suggestion to preview the rebooking action." />
        )}
      </DetailCard>

      <DetailCard title="Active rules" subtitle="Service and staff-specific cadence rules currently driving the suggestion list.">
        <View style={part3Styles.stack}>
          {(dashboard?.rules ?? []).map((rule) => (
            <ListRow
              key={rule.id}
              icon="repeat-outline"
              title={rule.label}
              subtitle={`${rule.scope} rule · ${rule.cadence_days} day cadence`}
              right={rule.active ? "active" : "paused"}
            />
          ))}
        </View>
      </DetailCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Rebooking prompts"
        subtitle="Suggested follow-up messages and cadence rules"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="calendar-number-outline" label="Due this week" value={String(dashboard?.summary.due_this_week ?? 0)} />
        <IconStatCard icon="options-outline" label="Rules" value={String(dashboard?.summary.rules ?? 0)} />
        <IconStatCard icon="send-outline" label="Scheduled" value={String(dashboard?.summary.scheduled_reminders ?? 0)} />
        <IconStatCard icon="checkmark-done-outline" label="Recovered" value={String(dashboard?.summary.recovered_clients ?? 0)} />
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
