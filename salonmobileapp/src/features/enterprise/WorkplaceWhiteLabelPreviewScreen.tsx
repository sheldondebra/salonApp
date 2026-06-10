import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { DetailCard, StatusPill, TagList, part3Styles } from "@/features/part3/Part3Shared";
import { sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { colors, radii, spacing } from "@/theme/colors";
import {
  fetchWhiteLabelPreview,
  type WhiteLabelPreview,
} from "@/workplace/api";

const FALLBACK_PREVIEW: WhiteLabelPreview = {
  app_name: "Glow & Go",
  plan: "Enterprise Plus",
  primary_hex: "#0F766E",
  accent_hex: "#F97316",
  custom_domain: "app.glowandgo.com",
  assets: { logo: true, splash: true, icon: false },
  modules: ["Bookings", "Discovery", "Favorites", "Wallet", "Memberships"],
};

export function WorkplaceWhiteLabelPreviewScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [preview, setPreview] = useState<WhiteLabelPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setPreview(await fetchWhiteLabelPreview(auth));
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview branding.` : "Could not load white-label preview."
      );
      setPreview(FALLBACK_PREVIEW);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

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
        <LoadingState message="Loading white-label preview…" />
      </ResponsiveShell>
    );
  }

  const brand = preview ?? FALLBACK_PREVIEW;

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="White-label preview"
        subtitle="Brand theme, modules, and domain status"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="color-palette-outline" label="Primary" value={brand.primary_hex} />
        <IconStatCard icon="sparkles-outline" label="Accent" value={brand.accent_hex} />
        <IconStatCard icon="globe-outline" label="Domain" value={brand.custom_domain || "Pending"} />
        <IconStatCard icon="apps-outline" label="Modules" value={String(brand.modules.length)} />
      </IconStatGrid>

      <DetailCard
        title={brand.app_name}
        subtitle={`${brand.plan} plan · preview of how the client shell will feel once branded assets are enabled`}
      >
        <View style={styles.previewFrame}>
          <View style={[styles.previewHeader, { backgroundColor: brand.primary_hex }]}>
            <Text style={styles.previewTitle}>{brand.app_name}</Text>
            <Text style={styles.previewSubtitle}>Book. Rebook. Discover.</Text>
          </View>
          <View style={styles.previewBody}>
            <View style={[styles.previewCard, { borderColor: brand.accent_hex }]}>
              <Text style={styles.previewCardTitle}>Featured booking CTA</Text>
              <Text style={styles.previewBodyText}>Personalized theme colors and module access would render here.</Text>
            </View>
            <View style={styles.inlineRow}>
              <StatusPill label={brand.assets.logo ? "Logo ready" : "Logo pending"} tone={brand.assets.logo ? "success" : "warning"} />
              <StatusPill label={brand.assets.splash ? "Splash ready" : "Splash pending"} tone={brand.assets.splash ? "success" : "warning"} />
              <StatusPill label={brand.assets.icon ? "Icon ready" : "Icon pending"} tone={brand.assets.icon ? "success" : "warning"} />
            </View>
          </View>
        </View>
      </DetailCard>

      <DetailCard title="Enabled modules" subtitle="Only the modules on the customer plan should appear in the branded app shell.">
        <TagList values={brand.modules} />
      </DetailCard>

      <DetailCard title="Domain controls" subtitle="Domain cutover and theme publishing still rely on the enterprise web settings flow.">
        <View style={part3Styles.stack}>
          <ListRow icon="globe-outline" title="Custom domain" subtitle="Hostname reserved for the branded app" right={brand.custom_domain || "Pending"} />
          <ListRow icon="shield-outline" title="Plan gating" subtitle="Feature availability based on subscription tier" right={brand.plan} />
        </View>
      </DetailCard>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  previewFrame: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewHeader: {
    padding: spacing.lg,
    gap: 4,
  },
  previewTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  previewSubtitle: { fontSize: 14, color: "#E5E7EB" },
  previewBody: { padding: spacing.md, gap: spacing.md },
  previewCard: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  previewCardTitle: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, marginBottom: 4 },
  previewBodyText: { fontSize: 13, color: colors.mutedForeground, lineHeight: 19 },
  inlineRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
