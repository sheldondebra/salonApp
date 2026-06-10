import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard } from "@/components/ui/IconStatCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { fetchClientProfile, type ClientProfilePayload } from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

type SectionId = "visits" | "health" | "records" | "notes" | "payments" | "loyalty" | "timeline";

function formatMoney(cents: number) {
  return `₵${(cents / 100).toFixed(2)}`;
}

function CollapsibleSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: SectionId | null;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const expanded = open === id;
  return (
    <Card>
      <Pressable onPress={() => onToggle(id)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? "−" : "+"}</Text>
      </Pressable>
      {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
    </Card>
  );
}

export function WorkplaceClientProfileScreen({ clientId }: { clientId: number }) {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const [profile, setProfile] = useState<ClientProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<SectionId | null>("visits");

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError("");
    try {
      setProfile(await fetchClientProfile({ token, tenantSlug }, clientId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load profile");
      setProfile(null);
    }
  }, [token, tenantSlug, clientId]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <LoadingState message="Loading client profile…" />;

  if (error || !profile) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Client profile" />
        <EmptyState title="Profile unavailable" description={error || "Try again."} />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
        <Button label="Retry" onPress={() => void load()} />
      </ResponsiveShell>
    );
  }

  const { client, stats } = profile;

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          title={client.name}
          subtitle={[client.email, client.phone].filter(Boolean).join(" · ")}
        />

        <View style={styles.statsGrid}>
          <IconStatCard icon="cash-outline" label="Total spend" value={formatMoney(stats.total_spend_cents)} style={styles.statCard} />
          <IconStatCard icon="time-outline" label="Visits" value={String(stats.visit_count)} style={styles.statCard} />
          <IconStatCard icon="calendar-outline" label="No-shows" value={String(stats.no_show_count)} style={styles.statCard} />
          <IconStatCard icon="gift-outline" label="Points" value={String(profile.loyalty?.points_balance ?? 0)} style={styles.statCard} />
        </View>

        <CollapsibleSection id="visits" title="Visit history" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.visits.length === 0 ? (
            <Text style={styles.muted}>No visits yet.</Text>
          ) : (
            profile.visits.map((v) => (
              <Text key={v.uuid} style={styles.row}>
                {v.service_name ?? "Service"} · {v.status}
              </Text>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection id="health" title="Allergies & patch tests" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.allergies.length === 0 && profile.patch_tests.length === 0 ? (
            <Text style={styles.muted}>No health records.</Text>
          ) : (
            <>
              {profile.allergies.map((a) => (
                <Text key={`a-${a.id}`} style={styles.row}>⚠ {a.allergen} ({a.severity})</Text>
              ))}
              {profile.patch_tests.map((p) => (
                <Text key={`p-${p.id}`} style={styles.row}>{p.product_name} · {p.result}</Text>
              ))}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="records" title="Treatments & photos" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.treatments.map((t) => (
            <Text key={t.id} style={styles.row}>{t.service_name}</Text>
          ))}
          {profile.media.map((m) => (
            <Pressable key={m.id} onPress={() => void Linking.openURL(m.url)}>
              <Text style={[styles.row, styles.link]}>{m.kind}: {m.caption ?? m.url}</Text>
            </Pressable>
          ))}
          {profile.documents.map((d) => (
            <Pressable key={d.id} onPress={() => void Linking.openURL(d.file_url)}>
              <Text style={[styles.row, styles.link]}>{d.title}</Text>
            </Pressable>
          ))}
        </CollapsibleSection>

        <CollapsibleSection id="notes" title="Notes" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.notes.length === 0 ? (
            <Text style={styles.muted}>No notes.</Text>
          ) : (
            profile.notes.map((n) => <Text key={n.id} style={styles.row}>{n.body}</Text>)
          )}
        </CollapsibleSection>

        <CollapsibleSection id="payments" title="Payments" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.payments.length === 0 ? (
            <Text style={styles.muted}>No payments.</Text>
          ) : (
            profile.payments.map((p) => (
              <Text key={p.id} style={styles.row}>{formatMoney(p.amount_cents)} · {p.status}</Text>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection id="loyalty" title="Loyalty" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.loyalty ? (
            <Text style={styles.row}>{profile.loyalty.points_balance} pts · {profile.loyalty.lifetime_points} lifetime</Text>
          ) : (
            <Text style={styles.muted}>No loyalty account.</Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="timeline" title="Timeline" open={openSection} onToggle={(id) => setOpenSection(openSection === id ? null : id)}>
          {profile.timeline.length === 0 ? (
            <Text style={styles.muted}>No activity.</Text>
          ) : (
            profile.timeline.map((ev, i) => (
              <Text key={`${ev.type}-${i}`} style={styles.row}>{ev.title} · {ev.subtitle}</Text>
            ))
          )}
        </CollapsibleSection>

        <Button label="Back to clients" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: { width: "48%", flexGrow: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.black },
  chevron: { fontSize: 20, color: colors.mutedForeground },
  sectionBody: { paddingBottom: spacing.sm, gap: 6 },
  row: { fontSize: 14, color: colors.black, marginBottom: 4 },
  muted: { fontSize: 14, color: colors.mutedForeground },
  link: { color: colors.primary },
});
