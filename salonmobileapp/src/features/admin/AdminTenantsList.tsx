import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchAdminTenants } from "@/admin/api";
import type { AdminTenant } from "@/admin/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { colors, radii, spacing } from "@/theme/colors";

export function AdminTenantsList() {
  const { token } = useAuth();
  const { gridColumns, isTablet } = useResponsiveLayout();
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminTenants({ token }, { q: query.trim() || undefined });
      setTenants(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load salons");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const cardWidth = gridColumns === 1 ? "100%" : gridColumns === 2 ? "48%" : "31%";

  return (
    <ResponsiveShell>
      <Header title="Salon workspaces" subtitle="All tenants on the platform" />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or slug…"
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
      ) : tenants.length === 0 ? (
        <EmptyState title="No salons found" description="Try a different search." />
      ) : (
        <View style={[styles.grid, isTablet && styles.gridTablet]}>
          {tenants.map((t) => (
            <Card key={t.id} style={[styles.card, { width: cardWidth }]}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.slug}>{t.slug}</Text>
              <View style={styles.row}>
                <Text style={styles.badge}>{t.plan ?? "—"}</Text>
                <Text style={styles.badgeMuted}>{t.status ?? "—"}</Text>
              </View>
              {t.owner ? (
                <Text style={styles.owner}>
                  {t.owner.name} · {t.owner.email}
                </Text>
              ) : null}
              {t.users_count != null ? (
                <Text style={styles.meta}>{t.users_count} team members</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
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
  },
  grid: { gap: spacing.md },
  gridTablet: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { gap: 6 },
  name: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  slug: { fontSize: 13, color: colors.mutedForeground },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryForeground,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  badgeMuted: {
    fontSize: 12,
    color: colors.mutedForeground,
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  owner: { fontSize: 13, color: colors.mutedForeground },
  meta: { fontSize: 12, color: colors.mutedForeground },
  error: { color: colors.destructive, marginBottom: spacing.md },
});
