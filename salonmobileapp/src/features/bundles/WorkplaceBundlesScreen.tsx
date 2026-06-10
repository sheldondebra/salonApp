import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionTitle, StepFlowCard, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchProductBundles, type ProductBundle } from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceBundlesScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const res = await fetchProductBundles(auth, { per_page: 50 });
      const nextBundles = res.data ?? [];
      setBundles(nextBundles);
      setSelectedBundleId((current) => current ?? nextBundles[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bundles");
      setBundles([]);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const selectedBundle = useMemo(
    () => bundles.find((bundle) => bundle.id === selectedBundleId) ?? bundles[0] ?? null,
    [bundles, selectedBundleId]
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
        <LoadingState message="Loading bundles…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Product bundles" subtitle="Retail sets that sell as one line in POS." />
      {bundles.length === 0 ? (
        <EmptyState
          title="No bundles yet"
          description="Create bundles in Schedelux web, then use this screen to review bundle content on mobile."
        />
      ) : (
        bundles.map((bundle) => {
          const selected = bundle.id === selectedBundle?.id;
          return (
            <Pressable
              key={bundle.id}
              onPress={() => setSelectedBundleId(bundle.id)}
              style={[styles.bundleCard, selected && styles.bundleCardSelected]}
            >
              <Text style={styles.bundleTitle}>{bundle.name}</Text>
              <Text style={styles.bundleMeta}>
                {formatMoney(bundle.price_cents)} · {bundle.is_active ? "Active" : "Inactive"}
              </Text>
              <Text style={styles.bundleMeta}>{bundle.items?.length ?? 0} items</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{selectedBundle?.name || "Select a bundle"}</Text>
        <Text style={sharedStyles.muted}>
          {selectedBundle?.description || "Bundle descriptions and store merchandising live in the web workspace."}
        </Text>
        {selectedBundle ? (
          <View style={styles.metricGrid}>
            <Card>
              <Text style={styles.metricLabel}>Bundle price</Text>
              <Text style={styles.metricValue}>{formatMoney(selectedBundle.price_cents)}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Items</Text>
              <Text style={styles.metricValue}>{selectedBundle.items?.length ?? 0}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={styles.metricValue}>{selectedBundle.is_active ? "Active" : "Inactive"}</Text>
            </Card>
          </View>
        ) : null}
      </Card>

      <StepFlowCard
        title="Bundle quick actions"
        description="Keep bundle sales simple for staff who just need pricing and stock context."
        steps={[
          "Choose the bundle from the catalog list.",
          "Review included products and bundle pricing.",
          "Use Add bundle to POS when the checkout flow is connected.",
        ]}
      >
        <Button
          label="Add bundle to POS"
          onPress={() =>
            Alert.alert(
              "POS handoff placeholder",
              "Bundle-to-cart handoff will connect to the mobile POS checkout flow in a later batch."
            )
          }
        />
      </StepFlowCard>

      <Card style={styles.detailCard}>
        <SectionTitle title="Bundle items" subtitle="Inventory units deducted when the bundle sells" />
        {selectedBundle?.items && selectedBundle.items.length > 0 ? (
          selectedBundle.items.map((item) => (
            <ListRow
              key={item.id}
              icon="cube-outline"
              title={item.product_name || `Product #${item.product_id}`}
              subtitle="Stock deduction per bundle sale"
              right={`x${item.quantity}`}
            />
          ))
        ) : (
          <EmptyState
            title="No bundle items"
            description="Bundle composition details will appear here when the backend returns them."
          />
        )}
      </Card>
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Bundles"
        subtitle="Review retail bundles and hand them off to POS"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        <IconStatCard icon="layers-outline" label="Bundles" value={String(bundles.length)} />
        <IconStatCard
          icon="checkmark-circle-outline"
          label="Active"
          value={String(bundles.filter((bundle) => bundle.is_active).length)}
        />
        <IconStatCard
          icon="cube-outline"
          label="Total items"
          value={String(
            bundles.reduce((sum, bundle) => sum + (bundle.items?.length ?? 0), 0)
          )}
        />
        <IconStatCard
          icon="cash-outline"
          label="Selected price"
          value={selectedBundle ? formatMoney(selectedBundle.price_cents) : "GHS 0.00"}
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
  bundleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  bundleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  bundleTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  bundleMeta: { fontSize: 13, color: colors.mutedForeground },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 15, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
});
