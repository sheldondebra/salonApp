import { useCallback, useEffect, useState } from "react";
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
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import { StepFlowCard, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import {
  fetchSocialLinksDashboard,
  type SocialLinksDashboard,
} from "@/workplace/api";

const FALLBACK_DASHBOARD: SocialLinksDashboard = {
  summary: {
    links: 3,
    clicks: 428,
    bookings: 39,
    top_platform: "Instagram",
  },
  share_copy: "Book your next appointment in two taps with Schedelux.",
  links: [
    {
      platform: "Instagram",
      handle: "@schedelux",
      url: "schedelux.app/ig",
      clicks: 210,
      bookings: 22,
      qr_ready: true,
    },
    {
      platform: "Facebook",
      handle: "Schedelux salon",
      url: "schedelux.app/fb",
      clicks: 118,
      bookings: 10,
      qr_ready: false,
    },
    {
      platform: "TikTok",
      handle: "@schedelux.glow",
      url: "schedelux.app/tiktok",
      clicks: 100,
      bookings: 7,
      qr_ready: true,
    },
  ],
};

export function WorkplaceSocialLinksScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [dashboard, setDashboard] = useState<SocialLinksDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setDashboard(await fetchSocialLinksDashboard(auth));
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview links.` : "Could not load social links."
      );
      setDashboard(FALLBACK_DASHBOARD);
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
        <LoadingState message="Loading social links…" />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Social booking links"
        subtitle="Share-ready booking URLs and source tracking"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="share-social-outline" label="Links" value={String(dashboard?.summary.links ?? 0)} />
        <IconStatCard icon="move-outline" label="Clicks" value={String(dashboard?.summary.clicks ?? 0)} />
        <IconStatCard icon="calendar-clear-outline" label="Bookings" value={String(dashboard?.summary.bookings ?? 0)} />
        <IconStatCard icon="star-outline" label="Top source" value={dashboard?.summary.top_platform || "—"} />
      </IconStatGrid>

      <DetailCard
        title="Quick-share caption"
        subtitle="Staff can copy this promo text for social posts, story replies, or QR handouts."
      >
        <Text style={part3Styles.muted}>{dashboard?.share_copy || "No share copy configured yet."}</Text>
        <Button
          label="Copy share text"
          variant="secondary"
          onPress={() =>
            Alert.alert("Copy placeholder", "Clipboard support will be connected to the device share sheet in a follow-up batch.")
          }
        />
      </DetailCard>

      <View style={styles.linkStack}>
        {(dashboard?.links ?? []).map((link) => (
          <DetailCard key={link.platform} title={link.platform} subtitle={link.handle || link.url}>
            <View style={styles.pillRow}>
              <StatusPill label={`${link.clicks} clicks`} tone="info" />
              <StatusPill label={`${link.bookings} bookings`} tone="success" />
              <StatusPill label={link.qr_ready ? "QR ready" : "QR pending"} tone={link.qr_ready ? "success" : "warning"} />
            </View>
            <View style={part3Styles.stack}>
              <ListRow icon="link-outline" title="Booking URL" subtitle={link.url} right={link.platform} />
            </View>
          </DetailCard>
        ))}
      </View>

      <StepFlowCard
        title="How salons use social links"
        description="The mobile view is designed for managers who are live on the salon floor and need fast access to source links."
        steps={[
          "Confirm which channel is currently bringing the most bookings.",
          "Share the correct branded link or QR placeholder from your phone.",
          "Use source counts to decide where the next campaign should go.",
        ]}
      />
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  linkStack: { gap: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
