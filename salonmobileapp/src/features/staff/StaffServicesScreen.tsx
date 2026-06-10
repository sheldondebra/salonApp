import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  bulkAssignStaffServices,
  fetchStaffCatalogServices,
  fetchStaffMember,
  fetchStaffServices,
  removeStaffService,
} from "@/staff/api";
import type { StaffCatalogService, StaffMember, StaffServiceAssignment } from "@/staff/types";
import { colors, radii, spacing } from "@/theme/colors";

type StaffServicesScreenProps = {
  staffId: number;
};

export function StaffServicesScreen({ staffId }: StaffServicesScreenProps) {
  const router = useRouter();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [assigned, setAssigned] = useState<StaffServiceAssignment[]>([]);
  const [catalog, setCatalog] = useState<StaffCatalogService[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const [member, rows, services] = await Promise.all([
        fetchStaffMember(auth, staffId),
        fetchStaffServices(auth, staffId),
        fetchStaffCatalogServices(auth),
      ]);
      setStaff(member);
      setAssigned(rows);
      setCatalog(services);
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [auth, staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeIds = useMemo(() => new Set(assigned.map((a) => a.service_id)), [assigned]);

  const categories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, StaffCatalogService[]>();
    for (const svc of catalog) {
      if (q && !svc.name.toLowerCase().includes(q) && !svc.category?.name?.toLowerCase().includes(q)) {
        continue;
      }
      const key = svc.category?.name ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(svc);
    }
    return [...map.entries()];
  }, [catalog, search]);

  const toggle = (id: number) => {
    if (activeIds.has(id)) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const assignSelected = async () => {
    if (!auth || !selected.length) return;
    setSaving(true);
    try {
      const merged = [...new Set([...activeIds, ...selected])];
      await bulkAssignStaffServices(auth, staffId, merged);
      setSelected([]);
      await load();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: StaffServiceAssignment) => {
    if (!auth) return;
    Alert.alert("Remove service?", row.service?.name ?? "Service", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void removeStaffService(auth, staffId, row.id)
            .then(load)
            .catch((err) =>
              Alert.alert("Error", err instanceof ApiError ? err.message : "Failed")
            );
        },
      },
    ]);
  };

  const picker = (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Add services</Text>
      <TextInput
        style={styles.search}
        placeholder="Search services…"
        placeholderTextColor={colors.mutedForeground}
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
        {categories.map(([cat, items]) => (
          <View key={cat} style={styles.catBlock}>
            <Text style={styles.catLabel}>{cat}</Text>
            <View style={styles.chips}>
              {items.map((svc) => {
                const on = activeIds.has(svc.id);
                const picked = selected.includes(svc.id);
                return (
                  <Pressable
                    key={svc.id}
                    disabled={on}
                    onPress={() => toggle(svc.id)}
                    style={[styles.chip, on && styles.chipDisabled, picked && styles.chipPicked]}
                  >
                    <Text style={[styles.chipText, picked && styles.chipTextPicked]}>{svc.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <Button
        label={saving ? "Saving…" : `Assign ${selected.length || ""} service${selected.length === 1 ? "" : "s"}`}
        onPress={() => void assignSelected()}
        disabled={!selected.length || saving}
      />
    </View>
  );

  const assignedList = (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Assigned ({assigned.length})</Text>
      <Text style={styles.hint}>
        Staff with no assignments can book any service. Assigned staff only appear for those services.
      </Text>
      {assigned.length === 0 ? (
        <Text style={styles.empty}>No services assigned yet.</Text>
      ) : (
        assigned.map((row) => (
          <View key={row.id} style={styles.assignedCard}>
            <View style={styles.assignedHead}>
              <View style={styles.flex}>
                <Text style={styles.assignedName}>{row.service?.name ?? "Service"}</Text>
                {row.service?.category?.name ? (
                  <Text style={styles.catSmall}>{row.service.category.name}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => remove(row)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </Pressable>
            </View>
            <Text style={styles.meta}>
              {row.effective_duration_minutes} min · {formatMoney(row.effective_price_cents, "USD")}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading) return <LoadingState message="Loading services…" />;

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScreenHeader title="Staff services" subtitle={staff?.display_name ?? ""} />
      <Button label="Back" variant="secondary" onPress={() => router.back()} style={styles.backBtn} />
      {useSplitLayout ? (
        <View style={styles.split}>
          <View style={styles.splitLeft}>{picker}</View>
          <View style={styles.splitRight}>{assignedList}</View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.phoneScroll}>
          {assignedList}
          {picker}
        </ScrollView>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  split: { flex: 1, flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.md },
  splitLeft: { flex: 1, minWidth: 0 },
  splitRight: { flex: 1, minWidth: 0 },
  phoneScroll: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  panel: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  panelTitle: { fontSize: 16, fontWeight: "700", color: colors.black, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.mutedForeground, marginBottom: spacing.md, lineHeight: 18 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.black,
    backgroundColor: colors.background,
  },
  pickerScroll: { maxHeight: 320, marginBottom: spacing.md },
  catBlock: { marginBottom: spacing.md },
  catLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipDisabled: { opacity: 0.4 },
  chipPicked: { borderColor: colors.accent, backgroundColor: `${colors.accent}18` },
  chipText: { fontSize: 12, color: colors.black },
  chipTextPicked: { color: colors.accent, fontWeight: "600" },
  empty: { fontSize: 14, color: colors.mutedForeground, fontStyle: "italic" },
  assignedCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.muted,
  },
  assignedHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  assignedName: { fontSize: 14, fontWeight: "600", color: colors.black },
  catSmall: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  meta: { fontSize: 12, color: colors.mutedForeground, marginTop: spacing.xs },
  flex: { flex: 1 },
});
