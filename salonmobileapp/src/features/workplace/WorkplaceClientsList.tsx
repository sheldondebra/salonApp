import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchClients, type ClientRow } from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceClientsList() {
  const router = useRouter();
  const { token, tenantSlug, logout } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError("");
    try {
      const res = await fetchClients(
        { token, tenantSlug },
        { q: debouncedQuery.trim() || undefined, per_page: 50 }
      );
      setClients(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load clients");
      setClients([]);
    }
  }, [token, tenantSlug, debouncedQuery]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Clients" />
        <EmptyState title="No salon selected" description="This account has no workspace." />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <ScreenHeader
          title="Clients"
          subtitle={`${total} in your salon`}
          onRefresh={() => void load()}
          onSignOut={() => void logout()}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, email, phone…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.search}
          onSubmitEditing={() => void load()}
          returnKeyType="search"
        />
        <Button label="Search" variant="secondary" onPress={() => void load()} />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
            <Button label="Retry" onPress={() => void load()} />
          </Card>
        ) : clients.length === 0 ? (
          <EmptyState title="No clients" description="Try a different search." />
        ) : (
          clients.map((c) => (
            <ListRow
              key={c.uuid}
              icon="person-outline"
              title={c.name}
              subtitle={[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}
              right={
                c.appointments_count != null ? `${c.appointments_count} visits` : undefined
              }
              onPress={() => router.push(`/workplace/clients/${c.id}` as never)}
            />
          ))
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  error: { color: colors.destructive, marginBottom: spacing.md },
});
