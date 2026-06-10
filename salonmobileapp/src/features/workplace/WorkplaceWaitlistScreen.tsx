import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  convertWaitlistEntry,
  createWaitlistEntry,
  fetchWaitlist,
  fetchWaitlistOpenings,
  notifyWaitlistClient,
  type WaitlistEntry,
  type WaitlistOpening,
} from "@/workplace/api";
import { fetchPosServices } from "@/pos/api";
import type { BookingService } from "@/booking/types";
import { colors, radii, spacing } from "@/theme/colors";

const STATUS_COLORS: Record<string, string> = {
  waiting: colors.mutedForeground,
  notified: colors.accent,
  booked: colors.success,
  cancelled: colors.destructive,
};

export function WorkplaceWaitlistScreen() {
  const { token, tenantSlug } = useAuth();
  const { isTablet } = useResponsiveLayout();
  const auth = useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug]
  );

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);
  const [openings, setOpenings] = useState<WaitlistOpening[]>([]);
  const [openingsLoading, setOpeningsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    preferredDate: new Date().toISOString().slice(0, 10),
    serviceId: 0,
  });

  const load = useCallback(async () => {
    if (!auth) return;
    try {
      const res = await fetchWaitlist(auth, { status: "waiting", per_page: 50 });
      setEntries(res.data ?? []);
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not load waitlist");
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!auth || !selected) {
      setOpenings([]);
      return;
    }
    setOpeningsLoading(true);
    void fetchWaitlistOpenings(auth, selected.uuid)
      .then(setOpenings)
      .catch(() => setOpenings([]))
      .finally(() => setOpeningsLoading(false));
  }, [auth, selected?.uuid]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openQuickAdd() {
    if (!auth) return;
    try {
      const svc = await fetchPosServices(auth);
      setServices(svc);
      setForm((f) => ({ ...f, serviceId: svc[0]?.id ?? 0 }));
      setAddOpen(true);
    } catch {
      Alert.alert("Error", "Could not load services");
    }
  }

  async function submitQuickAdd() {
    if (!auth || !form.serviceId || !form.clientName.trim() || !form.clientEmail.trim()) {
      Alert.alert("Missing fields", "Service, name, and email are required.");
      return;
    }
    try {
      await createWaitlistEntry(auth, {
        service_ids: [form.serviceId],
        preferred_date: form.preferredDate,
        client_name: form.clientName.trim(),
        client_email: form.clientEmail.trim(),
        client_phone: form.clientPhone.trim() || null,
      });
      setAddOpen(false);
      setForm({ clientName: "", clientEmail: "", clientPhone: "", preferredDate: new Date().toISOString().slice(0, 10), serviceId: 0 });
      await load();
      Alert.alert("Added", "Client added to waitlist.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not add");
    }
  }

  async function handleNotify(entry: WaitlistEntry) {
    if (!auth) return;
    try {
      await notifyWaitlistClient(auth, entry.uuid);
      await load();
      Alert.alert("Notified", "Client marked as notified.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Notify failed");
    }
  }

  async function handleConvert(entry: WaitlistEntry, opening: WaitlistOpening) {
    if (!auth) return;
    const startsAt = new Date(`${opening.date}T${opening.time}:00`).toISOString();
    try {
      await convertWaitlistEntry(auth, entry.uuid, {
        starts_at: startsAt,
        staff_member_id: opening.staff_member_id,
      });
      await load();
      Alert.alert("Booked", "Waitlist entry converted to a booking.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Convert failed");
    }
  }

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Waitlist" />
        <EmptyState title="No salon selected" description="Link a workplace to manage waitlist." />
      </ResponsiveShell>
    );
  }

  if (loading) return <LoadingState message="Loading waitlist…" />;

  const listPane = (
    <ScrollView
      style={styles.listPane}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      {entries.length === 0 ? (
        <EmptyState title="No one waiting" description="Clients join online when slots are full." />
      ) : (
        entries.map((entry) => (
          <Pressable
            key={entry.uuid}
            onPress={() => setSelected(entry)}
            style={[styles.row, selected?.uuid === entry.uuid && styles.rowActive]}
          >
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>{entry.client_name}</Text>
              <Text style={styles.rowMeta}>
                {entry.preferred_date}
                {entry.preferred_time ? ` · ${entry.preferred_time}` : ""}
              </Text>
              <Text style={styles.rowServices} numberOfLines={1}>
                {(entry.services ?? []).map((s) => s.name).join(", ")}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[entry.status] ?? colors.border }]} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );

  const detailPane = selected ? (
    <ScrollView style={styles.detailPane}>
      <Text style={styles.detailTitle}>{selected.client_name}</Text>
      <Text style={styles.detailMeta}>{selected.client_email}</Text>
      <Text style={styles.detailMeta}>
        Preferred {selected.preferred_date}
        {selected.preferred_time ? ` at ${selected.preferred_time}` : ""}
      </Text>
      {selected.staff_member?.name ? (
        <Text style={styles.detailMeta}>Staff · {selected.staff_member.name}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Notify client" variant="secondary" onPress={() => void handleNotify(selected)} />
      </View>

      <Text style={styles.sectionTitle}>Openings</Text>
      {openingsLoading ? (
        <Text style={styles.detailMeta}>Finding slots…</Text>
      ) : openings.length === 0 ? (
        <Text style={styles.detailMeta}>No openings in the next 7 days.</Text>
      ) : (
        openings.map((o) => (
          <Pressable key={`${o.date}-${o.time}`} style={styles.openingBtn} onPress={() => void handleConvert(selected, o)}>
            <Text style={styles.openingDate}>{o.date}</Text>
            <Text style={styles.openingTime}>{o.label}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  ) : (
    <View style={styles.detailPane}>
      <Text style={styles.detailMeta}>Select an entry</Text>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader title="Waitlist" subtitle={`${entries.length} waiting`} onRefresh={() => void onRefresh()} />
      <Button label="Quick add" onPress={() => void openQuickAdd()} style={{ marginBottom: spacing.sm }} />

      <View style={[styles.split, isTablet && styles.splitTablet]}>
        <View style={isTablet ? styles.listCol : styles.fullCol}>{listPane}</View>
        {isTablet ? <View style={styles.detailCol}>{detailPane}</View> : null}
      </View>

      {!isTablet && selected ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
          <View style={styles.sheet}>
            <Pressable style={styles.sheetClose} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={colors.black} />
            </Pressable>
            {detailPane}
          </View>
        </Modal>
      ) : null}

      <Modal visible={addOpen} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Quick add</Text>
          <Text style={styles.label}>Service</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {services.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setForm((f) => ({ ...f, serviceId: s.id }))}
                style={[styles.chip, form.serviceId === s.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.serviceId === s.id && styles.chipTextActive]}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Preferred date</Text>
          <TextInput style={styles.input} value={form.preferredDate} onChangeText={(v) => setForm((f) => ({ ...f, preferredDate: v }))} placeholder="YYYY-MM-DD" />
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={form.clientName} onChangeText={(v) => setForm((f) => ({ ...f, clientName: v }))} />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={form.clientEmail} onChangeText={(v) => setForm((f) => ({ ...f, clientEmail: v }))} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={form.clientPhone} onChangeText={(v) => setForm((f) => ({ ...f, clientPhone: v }))} keyboardType="phone-pad" />
          <Button label="Add to waitlist" onPress={() => void submitQuickAdd()} />
          <Button label="Cancel" variant="secondary" onPress={() => setAddOpen(false)} />
        </View>
      </Modal>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1 },
  splitTablet: { flexDirection: "row", gap: spacing.md },
  listCol: { flex: 1, minWidth: 0 },
  detailCol: { flex: 1, minWidth: 0, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: spacing.md },
  fullCol: { flex: 1 },
  listPane: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowActive: { backgroundColor: colors.muted },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: "700", color: colors.black },
  rowMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  rowServices: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  detailPane: { flex: 1, padding: spacing.md },
  detailTitle: { fontSize: 20, fontWeight: "800", color: colors.black },
  detailMeta: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.black },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  openingBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  openingDate: { fontWeight: "700", color: colors.black },
  openingTime: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  sheet: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  sheetClose: { alignSelf: "flex-end", padding: spacing.sm },
  sheetTitle: { fontSize: 20, fontWeight: "800", marginBottom: spacing.md, color: colors.black },
  label: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  chips: { maxHeight: 44, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground },
});
